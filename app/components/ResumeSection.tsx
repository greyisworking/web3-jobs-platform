'use client'

import { useRef } from 'react'
import { useResumes } from '@/hooks/useResumes'
import { FileText, Upload, Trash2, ExternalLink, Loader2 } from 'lucide-react'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ResumeSection() {
  const { resumes, isLoading, uploadResume, deleteResume } = useResumes()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadResume(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section className="mb-12">
      <h2 className="text-[11px] font-light uppercase tracking-[0.35em] text-a24-muted dark:text-a24-dark-muted mb-1">
        Resume
      </h2>
      <div className="w-8 h-px bg-a24-muted/40 dark:bg-a24-dark-muted/40 mb-6" />

      {/* Upload Area */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          id="resume-upload"
        />
        <label
          htmlFor="resume-upload"
          className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-a24-border dark:border-a24-dark-border hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer transition-colors"
        >
          <Upload size={18} className="text-a24-muted dark:text-a24-dark-muted" />
          <span className="text-sm text-a24-muted dark:text-a24-dark-muted">
            Upload Resume (PDF or Word, max 5MB)
          </span>
        </label>
      </div>

      {/* Resumes List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-a24-muted dark:text-a24-dark-muted" />
        </div>
      ) : resumes.length === 0 ? (
        <p className="text-sm text-a24-muted dark:text-a24-dark-muted">
          No resumes uploaded yet.
        </p>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <div
              key={resume.name}
              className="flex items-center justify-between p-3 bg-a24-surface dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={18} className="text-emerald-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-a24-text dark:text-a24-dark-text truncate">
                    {resume.name}
                  </p>
                  <p className="text-[10px] text-a24-muted dark:text-a24-dark-muted">
                    {formatFileSize(resume.size)} • {new Date(resume.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {resume.url && (
                  <a
                    href={resume.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-a24-muted dark:text-a24-dark-muted hover:text-emerald-500 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
                <button
                  onClick={() => deleteResume(resume.name)}
                  className="p-2 text-a24-muted dark:text-a24-dark-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
