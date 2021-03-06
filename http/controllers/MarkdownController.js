// Import utilities
const JRes = require('../util/JResponse')
const Helpers = require('../util/Helpers')
const SendError = require('../util/SendError')

// Import Markdown model
const Markdown = require('../models/Markdown')

module.exports = class MarkdownController {
  /**
   * Method for creating a new markdown
   * @param ctx - The current request context
   * @param next - The next state to transition to
   */
  static async create(ctx, next) {
    const content = ctx.request.body.content
    const user = ctx.state.user

    // Get owner (if available)
    const info = { content }
    if (!user.error) {
      info.owner = user.uid
    }

    // Save markdown
    const newMarkdown = new Markdown(info)
    const res = await newMarkdown.save()
    if (!res) {
      return SendError(ctx, 404, 'CREATE_MARKDOWN_FAILURE')
    }

    // Return success
    ctx.body = JRes.success('CREATE_MARKDOWN_SUCCESS', {
      markdown: Helpers.transformObj(newMarkdown, [
        '_id', 'owner', 'content', 'updated_at', 'created_at'
      ])
    })
  }

  /**
   * Method for finding a markdown
   * @param ctx - The current request context
   * @param next - The next state to transition to
   */
  static async find(ctx, next) {
    const id = ctx.params.id

    const md = await Markdown.findOne({ _id: id }).exec()
    if (!md) {
      return SendError(ctx, 404, 'FIND_MARKDOWN_FAILURE')
    }

    ctx.body = JRes.success('FIND_MARKDOWN_SUCCESS', {
      markdown: Helpers.transformObj(md, [
        '_id', 'owner', 'content', 'updated_at', 'created_at'
      ])
    })
  }

  static async findByUid(ctx, next) {
    const uid = ctx.params.uid

    const mds = await Markdown.find({ owner: uid }).exec()
    if (!mds) {
      return SendError(ctx, 404, 'FIND_USER_MARKDOWN_FAILURE')
    }

    ctx.body = JRes.success('FIND_USER_MARKDOWN_SUCCESS', {
      markdowns: Helpers.transformArray(mds, [
        '_id', 'owner', 'content', 'updated_at', 'created_at'
      ])
    })
  }

  /**
   * Method for updating a markdown
   * @param ctx - The current request context
   * @param next - The next state to transition to
   */
  static async update(ctx, next) {
    const id = ctx.params.id
    const user = ctx.state.user
    const content = ctx.request.body.content

    // Return if not owner of markdown
    if (user.error) return SendError(ctx, 403, user.error)

    // Update markdown
    const updated = await Markdown.update({ _id: id, owner: user.id }, {
      content: content,
      updated_at: Date.now
    }).exec()

    if (!updated) {
      return SendError(ctx, 400, 'UPDATE_MARKDOWN_FAILURE')
    }

    ctx.body = JRes.success('UPDATE_MARKDOWN_SUCCESS', {
      markdown: Helpers.transformObj(updated, [
        '_id', 'owner', 'content', 'updated_at', 'created_at'
      ])
    })
  }

  /**
   * Method for deleting a markdown
   * @param ctx - The current request context
   * @param next - The next state to transition to
   */
  static async destroy(ctx, next) {
    const id = ctx.params.id
    const user = ctx.state.user

    // Return if not owner of markdown
    if (user.error) return SendError(ctx, 403, user.error)

    const deleted = await Markdown.deleteOne({ _id: id, owner: user.id }).exec()
    if (!deleted) {
      return SendError(ctx, 400, 'DELETE_MARKDOWN_FAILURE')
    }

    ctx.body = JRes.success('DELETE_MARKDOWN_SUCCESS')
  }
}
