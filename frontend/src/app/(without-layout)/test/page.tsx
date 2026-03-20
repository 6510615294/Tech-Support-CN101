"use client"

import { useState } from "react"

export default function UploadAttachmentsPage() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const selectedFiles = Array.from(e.target.files)

    if (selectedFiles.length > 40) {
      setError("You can upload up to 40 files")
      return
    }

    setFiles(selectedFiles)
    setError(null)
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select files")
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const formData = new FormData()
      const token = localStorage.getItem("token");
      // IMPORTANT: must match backend key -> "files"
      files.forEach((file) => {
        formData.append("files", file)
      })

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/attachments`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Upload failed")
      }

      setMessage("Upload successful 🎉")
      setFiles([])
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Something went wrong")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Upload Attachments</h1>

      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="mb-4"
      />

      {files.length > 0 && (
        <div className="mb-4 text-sm">
          <p className="font-semibold">Selected files:</p>
          <ul className="list-disc ml-5">
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {message && (
        <p className="text-green-600 mt-4">{message}</p>
      )}

      {error && (
        <p className="text-red-600 mt-4">{error}</p>
      )}
    </div>
  )
}