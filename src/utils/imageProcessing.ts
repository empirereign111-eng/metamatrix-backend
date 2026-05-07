export const applyImageFilter = async (file: File, filterType: string): Promise<File> => {
  if (!filterType || filterType === 'none') return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        return resolve(file); // fallback
      }

      // Apply filter
      switch (filterType) {
        case 'grayscale':
          ctx.filter = 'grayscale(100%)';
          break;
        case 'sepia':
          ctx.filter = 'sepia(100%)';
          break;
        case 'vintage':
          ctx.filter = 'sepia(50%) hue-rotate(-30deg) saturate(140%) contrast(110%)';
          break;
        case 'warm':
          ctx.filter = 'sepia(30%) saturate(140%) hue-rotate(-10deg)';
          break;
        case 'cool':
          ctx.filter = 'saturate(120%) hue-rotate(10deg) brightness(110%)';
          break;
        case 'dramatic':
          ctx.filter = 'contrast(150%) saturate(120%) brightness(90%)';
          break;
        case 'brightness':
          ctx.filter = 'brightness(120%)';
          break;
        case 'contrast':
          ctx.filter = 'contrast(130%)';
          break;
        case 'saturate':
          ctx.filter = 'saturate(150%)';
          break;
        case 'invert':
          ctx.filter = 'invert(100%)';
          break;
        case 'blur':
          ctx.filter = 'blur(4px)';
          break;
        default:
          ctx.filter = 'none';
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          const newFile = new File([blob], file.name, { type: file.type || 'image/jpeg' });
          resolve(newFile);
        } else {
          resolve(file); // fallback
        }
      }, file.type || 'image/jpeg', 0.95);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback on error
    };

    img.src = url;
  });
};
