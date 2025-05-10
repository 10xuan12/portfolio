// resume_script.js
document.getElementById('resumeForm').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const language = document.getElementById('language').value;
    const position = document.getElementById('position').value;
    const status = document.getElementById('status');
    status.textContent = '正在生成履歷，請稍候...';
  
    try {
      const formData = new FormData();
      formData.append('language', language);
      formData.append('position', position);
  
      const response = await fetch('generate_resume.php', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) throw new Error('產生失敗');
  
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
  
      const link = document.createElement('a');
      link.href = url;
      link.download = 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      status.textContent = '✅ 履歷已下載';
    } catch (err) {
      status.textContent = '❌ 錯誤：' + err.message;
    }
  });
  