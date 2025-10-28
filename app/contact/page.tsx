'use client';

import React, { useState } from 'react';

export default function ContactPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!subject.trim() || !message.trim()) {
      setFeedback('件名と内容は必須です');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback('送信が完了しました。');
        setSubject('');
        setMessage('');
      } else {
        setFeedback(data.error || '送信に失敗しました');
      }
    } catch {
      setFeedback('送信に失敗しました');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 border rounded shadow bg-white">
      <h1 className="text-lg font-bold mb-4">お問い合わせ</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="件名"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <textarea
          placeholder="内容"
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          rows={5}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? '送信中...' : '送信'}
        </button>
        {feedback && (
          <div className="text-center text-sm mt-2 text-red-500">{feedback}</div>
        )}
      </form>
    </div>
  );
}
