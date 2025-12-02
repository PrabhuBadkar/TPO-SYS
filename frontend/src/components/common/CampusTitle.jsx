import TextType from './TextType';

export default function CampusTitle() {
  return (
    <h1 className="text-7xl md:text-8xl lg:text-9xl font-extrabold mb-6 tracking-tight">
      <span 
        className="text-white"
        style={{ 
          textShadow: '0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)'
        }}
      >
        Campus
      </span>
      <TextType
        text={["Connect", "Hub"]}
        as="span"
        typingSpeed={100}
        pauseDuration={2000}
        deletingSpeed={50}
        loop={true}
        showCursor={true}
        cursorCharacter="|"
        hideCursorWhileTyping={false}
        className="text-white ml-2"
        cursorClassName="text-white"
        style={{ 
          textShadow: '0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)'
        }}
      />
    </h1>
  );
}
