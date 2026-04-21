document.addEventListener('DOMContentLoaded', () => {
  const deleteForms = document.querySelectorAll('.delete-form');
  deleteForms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      if (!confirm('Are you sure you want to delete this post?')) {
        e.preventDefault();
      }
    });
  });

  const textareas = document.querySelectorAll('textarea');
  textareas.forEach((textarea) => {
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    });

    setTimeout(() => {
      textarea.dispatchEvent(new Event('input'));
    }, 50);
  });

  const imageInput = document.getElementById('image');
  const imagePreview = document.getElementById('imagePreview');
  const imagePreviewTag = document.getElementById('imagePreviewTag');

  if (imageInput && imagePreview && imagePreviewTag) {
    imageInput.addEventListener('change', (event) => {
      const [file] = event.target.files;
      if (!file) {
        imagePreview.setAttribute('aria-hidden', 'true');
        imagePreviewTag.classList.add('is-hidden');
        imagePreviewTag.removeAttribute('src');
        return;
      }

      imagePreviewTag.src = URL.createObjectURL(file);
      imagePreviewTag.classList.remove('is-hidden');
      imagePreview.removeAttribute('aria-hidden');
    });
  }
});
