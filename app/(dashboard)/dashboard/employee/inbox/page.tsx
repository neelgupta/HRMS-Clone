"use client";

import { useState, useEffect, Suspense } from "react";
import { toast } from "react-hot-toast";
import { MdEmail, MdSend, MdInbox as MdInboxIcon, MdClose, MdRefresh } from "react-icons/md";
import { EmployeeLayout } from "@/components/employee";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/text-input";
import { SelectInput } from "@/components/ui/select-input";
import { Skeleton } from "@/components/ui/loaders/skeleton";

interface Message {
  id: string;
  subject: string;
  content: string;
  fromUser: {
    id: string;
    name: string;
    email: string;
  };
  toUser: {
    id: string;
    name: string;
    email: string;
  };
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  designation: string;
}

function InboxContent() {
  const [selectedTab, setSelectedTab] = useState<"inbox" | "sent">("inbox");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  const [formData, setFormData] = useState({
    toUserId: "",
    subject: "",
    content: "",
  });

  useEffect(() => {
    fetchMessages();
    fetchEmployees();
  }, [selectedTab]);

  async function fetchMessages() {
    setLoading(true);
    try {
      const endpoint = selectedTab === "inbox" 
        ? "/api/messages/inbox" 
        : "/api/messages/sent";
      const res = await fetch(endpoint, { credentials: "include" });
      const data = await res.json();
      
      if (res.ok) {
        setMessages(data.messages || []);
      } else {
        toast.error(data.error || "Failed to fetch messages");
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }

  async function fetchEmployees() {
    try {
      const res = await fetch("/api/users?role=EMPLOYEE", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  }

  async function handleComposeSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.toUserId || !formData.subject || !formData.content) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Message sent successfully!");
        setComposeOpen(false);
        setFormData({ toUserId: "", subject: "", content: "" });
        if (selectedTab === "sent") {
          await fetchMessages();
        }
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setSubmitting(false);
    }
  }

  async function markAsRead(messageId: string) {
    try {
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: "PUT",
        credentials: "include",
      });
      
      if (res.ok) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, isRead: true, readAt: new Date().toISOString() }
              : msg
          )
        );
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => prev ? { ...prev, isRead: true } : null);
        }
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }

  async function viewMessage(message: Message) {
    setSelectedMessage(message);
    if (!message.isRead) {
      await markAsRead(message.id);
    }
  }

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Messages</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Communicate with colleagues and HR
          </p>
        </div>
        <button 
          onClick={() => setComposeOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <MdEmail className="text-lg" />
          Compose
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setSelectedTab("inbox")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            selectedTab === "inbox" 
              ? "bg-indigo-600 text-white" 
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          <MdInboxIcon className="text-lg" />
          Inbox
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">{unreadCount}</span>
          )}
        </button>
        <button 
          onClick={() => setSelectedTab("sent")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            selectedTab === "sent" 
              ? "bg-indigo-600 text-white" 
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          <MdSend className="text-lg" />
          Sent
        </button>
        <button 
          onClick={fetchMessages}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          title="Refresh"
        >
          <MdRefresh className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <MdInboxIcon className="text-3xl text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              {selectedTab === "inbox" ? "No messages in inbox" : "No sent messages"}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {selectedTab === "inbox" 
                ? "Messages from colleagues and HR will appear here" 
                : "Messages you send will appear here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                  !message.isRead ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                }`}
                onClick={() => viewMessage(message)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium truncate ${!message.isRead ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                        {message.subject}
                      </h3>
                      {!message.isRead && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {message.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>
                        {selectedTab === "inbox" ? `From: ${message.fromUser.name}` : `To: ${message.toUser.name}`}
                      </span>
                      <span>
                        {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Compose Message" size="md">
        <form onSubmit={handleComposeSubmit} className="p-6 space-y-6">
          <FormField label="To" required>
            <SelectInput
              value={formData.toUserId}
              onChange={(e) => setFormData({ ...formData, toUserId: e.target.value })}
              required
            >
              <option value="">Select recipient</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.designation || "Employee"}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Subject" required>
            <TextInput
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Enter subject"
              required
            />
          </FormField>

          <FormField label="Message" required>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              placeholder="Type your message here..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400"
              required
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setComposeOpen(false)}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <MdSend className="text-base" />
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Message Modal */}
      {selectedMessage && (
        <Modal 
          open={!!selectedMessage} 
          onClose={() => setSelectedMessage(null)} 
          title={selectedMessage.subject}
          size="lg"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  From: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedMessage.fromUser.name}</span>
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  To: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedMessage.toUser.name}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {selectedMessage.content}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default function InboxPage() {
  return (
    <EmployeeLayout title="Inbox" subtitle="Communicate with HR and colleagues">
      <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>}>
        <InboxContent />
      </Suspense>
    </EmployeeLayout>
  );
}