import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * Highlight range tied to a local comment id.
 */
export const CommentMark = Mark.create({
  name: 'comment',
  excludes: '',
  inclusive: false,

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-comment-id'),
        renderHTML: (attrs) =>
          attrs.commentId ? { 'data-comment-id': attrs.commentId } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'mark[data-comment-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      mergeAttributes(HTMLAttributes, {
        class: 'edu-docs-comment-mark bg-amber-200/70 dark:bg-amber-500/30',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCommentMark:
        (commentId) =>
        ({ commands }) =>
          commands.setMark(this.name, { commentId }),
      unsetCommentMark:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
