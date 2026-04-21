document.addEventListener('DOMContentLoaded', () => {
  const editorTokenStorageKey = 'malawi-hidden-gems:editor-tokens';

  function getStoredEditorTokens() {
    try {
      const rawValue = localStorage.getItem(editorTokenStorageKey);
      const parsedValue = rawValue ? JSON.parse(rawValue) : {};
      return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
    } catch (error) {
      return {};
    }
  }

  function setStoredEditorToken(postId, token) {
    const nextTokens = {
      ...getStoredEditorTokens(),
      [String(postId)]: token,
    };

    localStorage.setItem(editorTokenStorageKey, JSON.stringify(nextTokens));
  }

  const issuedEditorTokenNotice = document.querySelector('[data-issued-editor-token][data-issued-post-id]');
  if (issuedEditorTokenNotice) {
    setStoredEditorToken(
      issuedEditorTokenNotice.getAttribute('data-issued-post-id'),
      issuedEditorTokenNotice.getAttribute('data-issued-editor-token')
    );
  }

  const storedEditorTokens = getStoredEditorTokens();
  document.querySelectorAll('.editor-controls').forEach((controlGroup) => {
    const postId = controlGroup.getAttribute('data-post-id');
    const editorToken = storedEditorTokens[postId];

    if (!editorToken) {
      return;
    }

    controlGroup.classList.add('is-visible');

    const editLink = controlGroup.querySelector('.editor-edit-link');
    if (editLink) {
      const editUrl = new URL(editLink.getAttribute('href'), window.location.origin);
      editUrl.searchParams.set('editorToken', editorToken);
      editLink.setAttribute('href', `${editUrl.pathname}${editUrl.search}`);
    }

    controlGroup.querySelectorAll('.editor-token-field').forEach((field) => {
      field.value = editorToken;
    });
  });

  const standaloneEditorTokenField = document.getElementById('editorTokenField');
  if (standaloneEditorTokenField && !standaloneEditorTokenField.value) {
    const pathParts = window.location.pathname.split('/');
    const postId = pathParts.length >= 3 ? pathParts[2] : '';
    const editorToken = storedEditorTokens[postId];

    if (editorToken) {
      standaloneEditorTokenField.value = editorToken;
    }
  }

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
    imagePreview.setAttribute('aria-hidden', 'false');
  });
  }
});
