import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer, mergeAttributes } from '@tiptap/react';
import ResizableImageComponent from './ResizableImageComponent';

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: attributes => ({
          width: attributes.width,
        }),
        parseHTML: element => element.getAttribute('width'),
      },
      class: {
        default: 'resizable-image',
      }
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
