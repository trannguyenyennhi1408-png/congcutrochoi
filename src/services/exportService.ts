import { Question } from '../types';

export const exportQuestionsToWord = (subjectName: string, questions: Question[]) => {
  if (questions.length === 0) {
    alert('Không có câu hỏi nào để xuất!');
    return;
  }

  const content = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Đề Thi ${subjectName}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.5; }
        h1 { text-align: center; color: #1a365d; }
        .question-block { margin-bottom: 24px; }
        .question-text { font-weight: bold; margin-bottom: 8px; }
        .option { margin-left: 20px; margin-bottom: 4px; }
        .correct { color: #059669; font-weight: bold; }
        .explanation { margin-top: 8px; font-style: italic; color: #4b5563; }
      </style>
    </head>
    <body>
      <h1>ĐỀ THI TRẮC NGHIỆM: ${subjectName.toUpperCase()}</h1>
      <p style="text-align: right"><i>Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</i></p>
      <hr/>
      <br/>
      
      ${questions.map((q, idx) => `
        <div class="question-block">
          <div class="question-text">Câu ${idx + 1}: ${q.content}</div>
          ${q.options?.map((opt, oIdx) => `
            <div class="option">
              ${String.fromCharCode(65 + oIdx)}. ${opt} 
              ${opt === q.correctAnswer ? '<span class="correct">[Đáp án đúng]</span>' : ''}
            </div>
          `).join('')}
          ${q.explanation ? `<div class="explanation">=> Giải thích: ${q.explanation}</div>` : ''}
        </div>
      `).join('')}
      
      <br/>
      <hr/>
      <p style="text-align: center; font-size: 12pt;"><i>Tài liệu được tạo tự động bởi hệ thống EduGame AI</i></p>
    </body>
    </html>
  `;
  
  // Adding BOM \ufeff to ensure UTF-8 is parsed correctly by MS Word
  const blob = new Blob(['\ufeff', content], {
    type: 'application/msword;charset=utf-8'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `De_Thi_${subjectName.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
