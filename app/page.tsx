"use client";

import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";

export default function Chat() {
    const { messages, input, handleInputChange, handleSubmit } = useChat();

    return (
        <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
         Welcome to hedi
        </div>
    );
}
