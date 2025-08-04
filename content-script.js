function getSelectedCell() {
  const activeEl = document.activeElement;
  if (!activeEl || !activeEl.closest) return null;
  const cell = activeEl.closest('div.cell-input');
  return cell;
}

function insertFormula(formula) {
  document.execCommand('insertText', false, formula);
}

function uploadToDrive(file, callback) {
  const token = localStorage.getItem("google_access_token");
  if (!token) {
    alert("Please authorize with Google Drive first:\nhttps://architechbfa.github.io/sheets-drag-and-drop/");
    return;
  }

  const metadata = {
    name: file.name,
    mimeType: file.type
  };

  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const reader = new FileReader();
  reader.onload = function () {
    const contentType = file.type || 'application/octet-stream';
    const base64Data = btoa(reader.result);

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + contentType + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n' +
      '\r\n' +
      base64Data +
      close_delim;

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'multipart/related; boundary="' + boundary + '"'
      },
      body: multipartRequestBody
    })
    .then(res => res.json())
    .then(file => {
      const fileUrl = `https://drive.google.com/uc?id=${file.id}`;
      callback(fileUrl, file.name);
    })
    .catch(err => {
      console.error('Upload failed', err);
      alert("Upload failed. Try reauthorizing.");
    });
  };
  reader.readAsBinaryString(file);
}

document.addEventListener("dragover", (e) => {
  e.preventDefault();
});

document.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file) return;

  uploadToDrive(file, (fileUrl, fileName) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext);
    const formula = isImage
      ? `=IMAGE("${fileUrl}")`
      : `=HYPERLINK("${fileUrl}", "${fileName}")`;
    insertFormula(formula);
  });
});
