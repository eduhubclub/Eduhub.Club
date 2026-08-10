import fancyPencil from '../../assets/store/demo/fancy-pencil.jpg';
import hatDay from '../../assets/store/demo/hat-day.jpg';
import lunchWithTeacher from '../../assets/store/demo/lunch-with-teacher.jpg';
import teacherChair from '../../assets/store/demo/teacher-chair.jpg';

/** Bundled Unsplash photos for demo catalog item ids. */
export const DEMO_STORE_IMAGES = {
  'demo-store-pencil': fancyPencil,
  'demo-store-chair': teacherChair,
  'demo-store-lunch': lunchWithTeacher,
  'demo-store-hat': hatDay,
};

export function resolveStoreItemImageSrc(item) {
  if (!item) return '';
  if (item.imageDataUrl) return item.imageDataUrl;
  if (item.imageUrl) return item.imageUrl;
  return DEMO_STORE_IMAGES[item.id] || '';
}
