import { siteConfig } from '@/lib/config'
import { getPageCanCopy } from '@/lib/utils/copyPermission'
import { useState } from 'react'

/**
 * Copy the rendered Notion article, rather than surrounding menus, comments or ads.
 * Rich HTML preserves headings, links, tables, code and images in editors that
 * support HTML pasting. A plain-text representation is included as a fallback.
 */
export default function CopyArticleButton({ post }) {
  const [state, setState] = useState('idle')
  const canCopy = getPageCanCopy(siteConfig('CAN_COPY', true), post)

  if (!post || post.type !== 'Post' || !canCopy) {
    return null
  }

  const copyArticle = async () => {
    const container = document.getElementById('notion-article')
    const article =
      container?.querySelector('.notion-page-content') ||
      container?.querySelector('.notion-page') ||
      container?.querySelector('.notion')

    if (!article) {
      setState('error')
      return
    }

    const rich = article.cloneNode(true)
    rich.querySelectorAll(
      'button, script, style, .notion-code-copy-button, .notion-page-icon, .notion-collection-page-properties, .medium-zoom-overlay'
    ).forEach(node => node.remove())

    // Convert relative image and link paths to absolute URLs for pasting elsewhere.
    rich.querySelectorAll('a[href], img[src]').forEach(node => {
      const attribute = node.tagName === 'A' ? 'href' : 'src'
      const value = node.getAttribute(attribute)
      if (value && !value.startsWith('data:') && !value.startsWith('blob:')) {
        try {
          node.setAttribute(attribute, new URL(value, window.location.href).href)
        } catch (_) {
          // Leave unusual Notion protocols unchanged.
        }
      }
    })

    const title = post.title || ''
    const hasTitle = title && rich.textContent?.trimStart().startsWith(title)
    const titleHtml = title && !hasTitle
      ? '<h1>' + escapeHtml(title) + '</h1>'
      : ''
    const html = titleHtml + rich.outerHTML

    // In the fallback plain text, keep KaTeX source rather than copied glyph soup.
    const plain = rich.cloneNode(true)
    plain.querySelectorAll('.katex').forEach(node => {
      const latex = node.querySelector('annotation[encoding="application/x-tex"]')
      if (latex?.textContent) {
        const delimiter = node.closest('.katex-display') ? '$' : '
    })
    const text = (title && !hasTitle ? title + '\n\n' : '') +
      (article.innerText || plain.textContent || '').trim()

    setState('copying')
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' })
          })
        ])
      } else {
        await writePlainText(text)
      }
      setState('success')
    } catch (_) {
      try {
        await writePlainText(text)
        setState('success')
      } catch (_) {
        setState('error')
      }
    }
  }

  return (
    <div className='mb-4 flex items-center justify-end gap-2'>
      <button
        type='button'
        onClick={copyArticle}
        disabled={state === 'copying'}
        aria-label='一键复制博客全文'
        className='inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'>
        <span aria-hidden='true'>{state === 'success' ? '✓' : '⧉'}</span>
        {state === 'copying' ? '复制中…' : state === 'success' ? '已复制全文' : '复制全文'}
      </button>
      {state === 'error' && (
        <span role='alert' className='text-xs text-red-500'>
          复制失败，请检查浏览器剪贴板权限
        </span>
      )}
      {state === 'success' && (
        <span role='status' className='text-xs text-gray-500 dark:text-gray-400'>
          可粘贴到 Notion、文档或编辑器
        </span>
      )}
    </div>
  )
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char])
}

async function writePlainText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('Copy was not permitted')
}

        node.replaceWith(document.createTextNode(delimiter + latex.textContent + delimiter))
      }
    })
    const text = (title && !hasTitle ? title + '\n\n' : '') +
      (article.innerText || plain.textContent || '').trim()

    setState('copying')
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' })
          })
        ])
      } else {
        await writePlainText(text)
      }
      setState('success')
    } catch (_) {
      try {
        await writePlainText(text)
        setState('success')
      } catch (_) {
        setState('error')
      }
    }
  }

  return (
    <div className='mb-4 flex items-center justify-end gap-2'>
      <button
        type='button'
        onClick={copyArticle}
        disabled={state === 'copying'}
        aria-label='一键复制博客全文'
        className='inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'>
        <span aria-hidden='true'>{state === 'success' ? '✓' : '⧉'}</span>
        {state === 'copying' ? '复制中…' : state === 'success' ? '已复制全文' : '复制全文'}
      </button>
      {state === 'error' && (
        <span role='alert' className='text-xs text-red-500'>
          复制失败，请检查浏览器剪贴板权限
        </span>
      )}
      {state === 'success' && (
        <span role='status' className='text-xs text-gray-500 dark:text-gray-400'>
          可粘贴到 Notion、文档或编辑器
        </span>
      )}
    </div>
  )
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char])
}

async function writePlainText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('Copy was not permitted')
}
