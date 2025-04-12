// js/form.js
function previewAvatar(event) {
    const reader = new FileReader();
    reader.onload = function () {
        const output = document.getElementById('avatarPreview');
        output.src = reader.result;
        output.style.display = 'block';
    };
    reader.readAsDataURL(event.target.files[0]);
}
