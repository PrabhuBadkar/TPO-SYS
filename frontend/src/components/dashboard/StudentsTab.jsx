import { useState, useEffect } from 'react';
import './StudentsTab.css';

export default function StudentsTab() {
  const [stats, setStats] = useState(null);
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch overview stats and department stats in parallel
      const [overviewRes, deptRes] = await Promise.all([
        fetch('http://localhost:5000/api/internal/admin/stats/overview', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('http://localhost:5000/api/internal/admin/students/department-stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      const overviewData = await overviewRes.json();
      const deptData = await deptRes.json();

      if (overviewRes.ok && overviewData.success) {
        setStats(overviewData.data);
      }

      if (deptRes.ok && deptData.success) {
        // Assign colors to departments
        const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#feca57', '#ff6b6b', '#4ecdc4'];
        const departmentsWithColors = deptData.data.departments.map((dept, index) => ({
          ...dept,
          color: colors[index % colors.length],
        }));
        setDepartmentData(departmentsWithColors);
      }

      setError(null);
    } catch (err) {
      console.error('Stats fetch error:', err);
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = stats?.students?.total || 0;
  const newThisMonth = stats?.students?.newThisMonth || 0;
  const pendingVerification = stats?.verifications?.pending || 0;
  const urgentVerification = stats?.verifications?.urgent || 0;

  // Calculate total for percentage
  const totalDeptStudents = departmentData.reduce((sum, dept) => sum + dept.count, 0);

  // Calculate cumulative percentages for pie chart
  let cumulativePercentage = 0;
  const chartSegments = departmentData.map((dept) => {
    const percentage = totalDeptStudents > 0 ? (dept.count / totalDeptStudents) * 100 : 0;
    const segment = {
      ...dept,
      percentage,
      startPercentage: cumulativePercentage,
      endPercentage: cumulativePercentage + percentage,
    };
    cumulativePercentage += percentage;
    return segment;
  });

  if (loading) {
    return (
      <div className="students-tab">
        <div className="students-layout">
          <div className="students-left">
            <div className="stat-card-compact loading">
              <div className="card-skeleton"></div>
            </div>
            <div className="department-list-card loading">
              <div className="card-skeleton"></div>
            </div>
          </div>
          <div className="students-right">
            <div className="chart-card loading">
              <div className="card-skeleton"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="students-tab">
        <div className="error-message">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
          <button onClick={fetchAllData} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="students-tab">
      <div className="students-layout">
        {/* Left Side - Stats Cards */}
        <div className="students-left">
          {/* Total Students Card */}
          <div className="stat-card-compact stat-card-purple">
            <div className="card-icon-compact">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="card-info-compact">
              <h3 className="card-label-compact">Total Students</h3>
              <p className="card-value-compact">{totalStudents}</p>
              <div className="card-trend trend-up">
                <svg className="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>+{newThisMonth} this month</span>
              </div>
            </div>
          </div>

          {/* Department Breakdown List */}
          <div className="department-list-card">
            <h3 className="department-list-title">Department Breakdown</h3>
            <div className="department-list">
              {departmentData.length > 0 ? (
                departmentData.map((dept, index) => (
                  <div 
                    key={dept.name} 
                    className="department-item"
                    style={{ '--delay': `${index * 0.1}s`, '--color': dept.color }}
                  >
                    <div className="dept-color-indicator" style={{ background: dept.color }}></div>
                    <div className="dept-info">
                      <span className="dept-name">{dept.name}</span>
                      <span className="dept-count">{dept.count} students</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-message">
                  <p>No department data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Pie Chart */}
        <div className="students-right">
          <div className="chart-card">
            <h3 className="chart-title">Department Distribution</h3>
            
            {/* Animated Pie Chart */}
            {departmentData.length > 0 ? (
              <>
                <div className="pie-chart-container">
                  <svg className="pie-chart" viewBox="0 0 200 200">
                    {/* Outer Ring Shadow */}
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="rgba(168, 85, 247, 0.1)"
                      strokeWidth="10"
                      className="outer-ring"
                    />

                    {/* Background Circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="rgba(20, 10, 40, 0.4)"
                      stroke="rgba(168, 85, 247, 0.3)"
                      strokeWidth="2"
                    />

                    {/* Pie Segments */}
                    {chartSegments.map((segment, index) => {
                      const startAngle = (segment.startPercentage / 100) * 360 - 90;
                      const endAngle = (segment.endPercentage / 100) * 360 - 90;
                      const largeArcFlag = segment.percentage > 50 ? 1 : 0;

                      const startX = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                      const startY = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                      const endX = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                      const endY = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);

                      // Calculate label position (middle of segment)
                      const midAngle = (startAngle + endAngle) / 2;
                      const labelRadius = 60;
                      const labelX = 100 + labelRadius * Math.cos((midAngle * Math.PI) / 180);
                      const labelY = 100 + labelRadius * Math.sin((midAngle * Math.PI) / 180);

                      const pathData = [
                        `M 100 100`,
                        `L ${startX} ${startY}`,
                        `A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        `Z`,
                      ].join(' ');

                      return (
                        <g key={segment.name}>
                          {/* Segment Shadow */}
                          <path
                            d={pathData}
                            fill={segment.color}
                            opacity="0.3"
                            transform="translate(2, 2)"
                            className="segment-shadow"
                          />
                          
                          {/* Main Segment */}
                          <path
                            d={pathData}
                            fill={segment.color}
                            opacity="0.9"
                            className="pie-segment"
                            style={{ 
                              '--delay': `${index * 0.15}s`,
                              '--color': segment.color,
                            }}
                          />
                          
                          {/* Segment Border */}
                          <path
                            d={pathData}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="1.5"
                          />

                          {/* Percentage Label */}
                          {segment.percentage > 5 && (
                            <text
                              x={labelX}
                              y={labelY}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="14"
                              fontWeight="700"
                              className="segment-label"
                              style={{ 
                                '--delay': `${index * 0.15 + 0.5}s`,
                              }}
                            >
                              {segment.percentage.toFixed(1)}%
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Center Circle Shadow */}
                    <circle
                      cx="100"
                      cy="100"
                      r="52"
                      fill="rgba(0, 0, 0, 0.3)"
                    />

                    {/* Center Circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="50"
                      fill="rgba(20, 10, 40, 0.95)"
                      stroke="rgba(168, 85, 247, 0.5)"
                      strokeWidth="2"
                      className="center-circle"
                    />

                    {/* Center Decorative Ring */}
                    <circle
                      cx="100"
                      cy="100"
                      r="45"
                      fill="none"
                      stroke="rgba(168, 85, 247, 0.2)"
                      strokeWidth="1"
                      strokeDasharray="2 4"
                      className="center-ring"
                    />

                    {/* Center Text */}
                    <text
                      x="100"
                      y="92"
                      textAnchor="middle"
                      fill="#d8b4fe"
                      fontSize="11"
                      fontWeight="600"
                      letterSpacing="2"
                    >
                      TOTAL
                    </text>
                    <text
                      x="100"
                      y="110"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="26"
                      fontWeight="900"
                      className="center-value"
                    >
                      {totalDeptStudents}
                    </text>
                    <text
                      x="100"
                      y="122"
                      textAnchor="middle"
                      fill="#c084fc"
                      fontSize="9"
                      fontWeight="500"
                    >
                      STUDENTS
                    </text>
                  </svg>

                  {/* Glow Effect */}
                  <div className="chart-glow"></div>
                  
                  {/* Rotating Ring Effect */}
                  <div className="rotating-ring"></div>
                </div>

                {/* Legend */}
                <div className="chart-legend">
                  {departmentData.map((dept, index) => (
                    <div 
                      key={dept.name} 
                      className="legend-item"
                      style={{ '--delay': `${index * 0.1}s` }}
                    >
                      <div className="legend-color" style={{ background: dept.color }}></div>
                      <span className="legend-name">{dept.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="no-data-message">
                <p>No department data to display</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Verification Section - Below the main layout */}
      <div className="pending-verification-section">
        <div className="stat-card-compact stat-card-orange">
          <div className="card-icon-compact">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="card-info-compact">
            <h3 className="card-label-compact">Pending Verification</h3>
            <p className="card-value-compact">{pendingVerification}</p>
            <div className={`card-trend ${urgentVerification > 0 ? 'trend-urgent' : 'trend-neutral'}`}>
              <svg className="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{urgentVerification} urgent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
