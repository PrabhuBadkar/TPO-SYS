import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as fs from 'fs/promises'

/**
 * Watermark Service
 * Adds watermarks to PDF documents (resumes)
 */

export class WatermarkService {
  /**
   * Add watermark to resume PDF
   * @param inputPath - Path to original PDF
   * @param outputPath - Path to save watermarked PDF
   * @param watermarkText - Text to use as watermark (e.g., student name, enrollment number)
   */
  static async addWatermark(
    inputPath: string,
    outputPath: string,
    watermarkText: string
  ): Promise<void> {
    try {
      // Read the existing PDF
      const existingPdfBytes = await fs.readFile(inputPath)
      const pdfDoc = await PDFDocument.load(existingPdfBytes)

      // Get font
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      // Get all pages
      const pages = pdfDoc.getPages()

      // Add watermark to each page
      for (const page of pages) {
        const { width, height } = page.getSize()
        const fontSize = 10
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize)

        // Add watermark at bottom right
        page.drawText(watermarkText, {
          x: width - textWidth - 20,
          y: 20,
          size: fontSize,
          font: font,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.5,
        })

        // Add watermark at top right (for security)
        page.drawText(watermarkText, {
          x: width - textWidth - 20,
          y: height - 30,
          size: fontSize,
          font: font,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.5,
        })
      }

      // Save the watermarked PDF
      const pdfBytes = await pdfDoc.save()
      await fs.writeFile(outputPath, pdfBytes)
    } catch (error) {
      console.error('Watermarking error:', error)
      throw new Error('Failed to add watermark to PDF')
    }
  }

  /**
   * Generate watermark text for student
   * @param studentName - Student's full name
   * @param enrollmentNumber - Student's enrollment number
   * @param companyName - Company name (optional)
   */
  static generateWatermarkText(
    studentName: string,
    enrollmentNumber: string,
    companyName?: string
  ): string {
    const timestamp = new Date().toISOString().split('T')[0]
    
    if (companyName) {
      return `${studentName} (${enrollmentNumber}) - ${companyName} - ${timestamp}`
    }
    
    return `${studentName} (${enrollmentNumber}) - ${timestamp}`
  }

  /**
   * Watermark resume for job application
   * Creates a watermarked copy specifically for a job application
   */
  static async watermarkForApplication(
    originalPath: string,
    studentName: string,
    enrollmentNumber: string,
    companyName: string
  ): Promise<string> {
    const watermarkText = this.generateWatermarkText(
      studentName,
      enrollmentNumber,
      companyName
    )

    // Generate output path
    const timestamp = Date.now()
    const outputPath = originalPath.replace('.pdf', `_watermarked_${timestamp}.pdf`)

    await this.addWatermark(originalPath, outputPath, watermarkText)

    return outputPath
  }
}
