import jsPDF from 'jspdf';
import type { MockTest, TestResult } from '@/types/cefr';

export const generateTestPDF = (test: MockTest, title?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const testTitle = title || `${test.level} - ${test.skill.toUpperCase()} Test`;
  doc.text(testTitle, pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Vaqt: ${Math.floor(test.timeLimit / 60)} daqiqa  |  Savollar soni: ${test.parts.reduce((a, p) => a + p.questions.length, 0)}`, pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 10;

  // Line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  let globalQ = 1;

  test.parts.forEach((part) => {
    checkPage(30);

    // Part header
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Part ${part.id}: ${part.passage.title}`, margin, y);
    y += 6;

    if (part.instruction) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const instrLines = doc.splitTextToSize(part.instruction, maxWidth);
      checkPage(instrLines.length * 4 + 4);
      doc.text(instrLines, margin, y);
      y += instrLines.length * 4 + 4;
      doc.setTextColor(0, 0, 0);
    }

    // Reading passage (truncated for space)
    if (part.passage.content && test.skill === 'reading') {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      if (part.passage.paragraphs && part.passage.paragraphs.length > 0) {
        part.passage.paragraphs.forEach((para) => {
          checkPage(20);
          doc.setFont('helvetica', 'bold');
          doc.text(`${para.label}`, margin, y);
          doc.setFont('helvetica', 'normal');
          const paraLines = doc.splitTextToSize(para.text, maxWidth - 10);
          checkPage(paraLines.length * 3.5 + 6);
          doc.text(paraLines, margin + 10, y + 4);
          y += paraLines.length * 3.5 + 8;
        });
      } else {
        const passageLines = doc.splitTextToSize(part.passage.content, maxWidth);
        const maxLines = Math.min(passageLines.length, 30);
        checkPage(maxLines * 3.5 + 4);
        doc.text(passageLines.slice(0, maxLines), margin, y);
        y += maxLines * 3.5 + 6;
      }
    }

    y += 4;

    // Questions
    part.questions.forEach((q) => {
      checkPage(30);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const qLines = doc.splitTextToSize(`${globalQ}. ${q.question}`, maxWidth);
      doc.text(qLines, margin, y);
      y += qLines.length * 4.5 + 2;

      // Options
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      q.options.forEach((opt, oi) => {
        checkPage(6);
        const letter = String.fromCharCode(65 + oi);
        const optLines = doc.splitTextToSize(`${letter}) ${opt}`, maxWidth - 8);
        doc.text(optLines, margin + 8, y);
        y += optLines.length * 3.5 + 1.5;
      });

      y += 4;
      globalQ++;
    });

    y += 6;
  });

  // Answer key on last page
  doc.addPage();
  y = 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Javoblar kaliti', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let ansNum = 1;
  test.parts.forEach((part) => {
    part.questions.forEach((q) => {
      checkPage(6);
      const answer = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer;
      doc.text(`${ansNum}. ${answer}`, margin, y);
      y += 5;
      ansNum++;
    });
  });

  doc.save(`${test.level}_${test.skill}_test.pdf`);
};

export const generateResultPDF = (result: TestResult, test: MockTest) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Test Natijalari', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Daraja: ${result.level}  |  Tur: ${result.skill}  |  Ball: ${result.percentage}%`, pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.text(`To'g'ri: ${result.correctAnswers}/${result.totalQuestions}  |  ${result.passed ? "O'tdi ✓" : "O'tmadi ✗"}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Detailed answers
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Javoblar tahlili', margin, y);
  y += 8;

  let qNum = 1;
  test.parts.forEach((part) => {
    part.questions.forEach((q) => {
      const answer = result.answers.find(a => a.questionId === q.id);
      const isCorrect = answer?.isCorrect || false;

      checkPage(20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isCorrect ? 0 : 180, isCorrect ? 150 : 0, 0);
      doc.text(`${qNum}. ${isCorrect ? '✓' : '✗'}`, margin, y);
      doc.setTextColor(0, 0, 0);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const qLines = doc.splitTextToSize(q.question, maxWidth - 15);
      doc.text(qLines, margin + 15, y);
      y += qLines.length * 3.5 + 2;

      const userAns = Array.isArray(answer?.userAnswer) ? answer?.userAnswer.join(', ') : (answer?.userAnswer || '-');
      doc.text(`Sizning javob: ${userAns}`, margin + 15, y);
      y += 4;

      if (!isCorrect) {
        const correctAns = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer;
        doc.setTextColor(0, 130, 0);
        doc.text(`To'g'ri javob: ${correctAns}`, margin + 15, y);
        doc.setTextColor(0, 0, 0);
        y += 4;
      }

      y += 3;
      qNum++;
    });
  });

  doc.save(`${result.level}_${result.skill}_natijalar.pdf`);
};
