"use client";

import { useState, useRef } from "react";
import { useWizardStore, Material } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Upload, Link2, FileText, Image } from "lucide-react";

export function Step1Materials() {
  const { materials, addMaterial, removeMaterial, setStep } = useWizardStore();
  const [linkInput, setLinkInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const mat: Material = {
          id: crypto.randomUUID(),
          type: file.type.startsWith("image/") ? "file" : "file",
          name: file.name,
          content: ev.target?.result as string,
          preview: file.type.startsWith("image/") ? ev.target?.result as string : undefined,
        };
        addMaterial(mat);
      };
      reader.readAsDataURL(file);
    });
  };

  const addLink = () => {
    if (!linkInput.trim()) return;
    const mat: Material = {
      id: crypto.randomUUID(),
      type: "link",
      name: linkInput.slice(0, 50),
      content: linkInput,
    };
    addMaterial(mat);
    setLinkInput("");
  };

  const addText = () => {
    if (!textInput.trim()) return;
    const mat: Material = {
      id: crypto.randomUUID(),
      type: "text",
      name: textInput.slice(0, 30) + "...",
      content: textInput,
    };
    addMaterial(mat);
    setTextInput("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Step 1: 素材上传</h2>
        <p className="text-muted-foreground">上传你的产品素材，链接或文字都可以</p>
      </div>

      {/* Upload Zone */}
      <Card className="p-8 border-dashed border-2 border-primary/40 hover:border-primary/60 transition-colors cursor-pointer" onClick={() => fileRef.current?.click()}>
        <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">拖拽文件到此处 或 点击上传</p>
            <p className="text-sm text-muted-foreground mt-1">支持 JPG/PNG/PDF/Word/PPT</p>
          </div>
        </div>
      </Card>

      {/* Link Input */}
      <Card className="p-4">
        <div className="flex gap-2 items-center mb-3">
          <Link2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">添加链接</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="粘贴网址链接..."
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
          />
          <Button onClick={addLink} variant="secondary">添加</Button>
        </div>
      </Card>

      {/* Text Input */}
      <Card className="p-4">
        <div className="flex gap-2 items-center mb-3">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">添加文字</span>
        </div>
        <div className="flex flex-col gap-2">
          <textarea
            className="w-full bg-secondary/50 border border-input rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            placeholder="直接粘贴文字内容..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
          <Button onClick={addText} variant="secondary" className="self-end">添加</Button>
        </div>
      </Card>

      {/* Material List */}
      {materials.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">已上传 {materials.length} 份素材</p>
          {materials.map((m) => (
            <Card key={m.id} className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                {m.type === "link" ? <Link2 className="w-5 h-5" /> : m.type === "text" ? <FileText className="w-5 h-5" /> : <Image className="w-5 h-5" />}
              </div>
              {m.preview ? (
                <img src={m.preview} className="w-10 h-10 rounded object-cover" alt="" />
              ) : null}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground truncate">{m.type === "link" ? m.content : m.content.slice(0, 50)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeMaterial(m.id)}>
                <X className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setStep(2)} disabled={materials.length === 0}>
          确认素材 →
        </Button>
      </div>
    </div>
  );
}
