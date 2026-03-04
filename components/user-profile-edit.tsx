"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Camera, Loader2, CheckCircle2, XCircle, Link as LinkIcon, Upload, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { signOut } from "next-auth/react"

interface UserProfileEditProps {
  open: boolean
  onCloseAction: () => void
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  onUpdateAction: () => void
}

export function UserProfileEdit({ open, onCloseAction, user, onUpdateAction }: UserProfileEditProps) {
  const [name, setName] = useState(user.name || "")
  const [photoUrl, setPhotoUrl] = useState(user.image || "")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("url")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande", {
        description: "A imagem deve ter no máximo 2MB",
        icon: <XCircle size={16} />
      })
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Formato inválido", {
        description: "Por favor, selecione uma imagem",
        icon: <XCircle size={16} />
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string)
      toast.success("Imagem carregada!", {
        description: "Sua foto foi selecionada com sucesso",
        icon: <CheckCircle2 size={16} />
      })
    }
    reader.onerror = () => {
      toast.error("Erro ao ler arquivo", {
        description: "Não foi possível processar a imagem",
        icon: <XCircle size={16} />
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!user.email) return
    
    setIsUploading(true)
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: name,
          photo: photoUrl
        })
      })

      if (!response.ok) throw new Error("Erro ao atualizar perfil")

      toast.success("Perfil atualizado!", {
        description: "Suas informações foram salvas com sucesso.",
        icon: <CheckCircle2 size={16} />
      })
      
      onUpdateAction()
      onCloseAction()
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      toast.error("Erro ao salvar", {
        description: "Não foi possível atualizar seu perfil.",
        icon: <XCircle size={16} />
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmFirst = confirm("⚠️ Tem certeza que deseja apagar sua conta? Esta ação é IRREVERSÍVEL.")
    if (!confirmFirst) return

    const confirmSecond = confirm("🚨 ÚLTIMO AVISO: Todos os seus livros e dados serão excluídos permanentemente. Confirmar exclusão?")
    if (!confirmSecond) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) throw new Error("Erro ao excluir conta")

      toast.success("Conta excluída", {
        description: "Seus dados foram removidos com sucesso.",
        icon: <CheckCircle2 size={16} />
      })

      await signOut({ callbackUrl: "/" })
    } catch (error) {
      console.error("Erro ao excluir conta:", error)
      toast.error("Erro ao excluir", {
        description: "Não foi possível excluir sua conta.",
        icon: <XCircle size={16} />
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-md border border-slate-200/50">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Editar Perfil</DialogTitle>
          <DialogDescription className="text-sm font-light text-slate-600">
            Atualize suas informações pessoais
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-2 border-slate-200 overflow-hidden shadow-md flex items-center justify-center bg-slate-100">
                {photoUrl ? (
                  <img src={photoUrl} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <Camera size={32} className="text-slate-400" />
                )}
              </div>
            </div>
            
            <div className="w-full">
              <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "url" | "file")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="url" className="text-xs">
                    <LinkIcon size={14} className="mr-1.5" />
                    URL da Web
                  </TabsTrigger>
                  <TabsTrigger value="file" className="text-xs">
                    <Upload size={14} className="mr-1.5" />
                    Arquivo Local
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="space-y-2">
                  <Label htmlFor="photo-url" className="text-xs font-medium text-slate-700">
                    Cole o link da imagem
                  </Label>
                  <Input
                    id="photo-url"
                    type="url"
                    placeholder="https://exemplo.com/foto.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Cole o link de uma imagem da internet
                  </p>
                </TabsContent>

                <TabsContent value="file" className="space-y-2">
                  <Label htmlFor="photo-file" className="text-xs font-medium text-slate-700">
                    Escolha uma foto
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="photo-file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="text-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Máximo 2MB • JPG, PNG ou GIF
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div>
            <Label htmlFor="name" className="text-xs font-medium text-slate-700">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-xs font-medium text-slate-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ""}
              disabled
              className="mt-1.5 text-sm bg-slate-50 text-slate-500"
            />
          </div>

          <div>
            <Separator className="mb-4" />
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900">Zona de Perigo</h4>
                  <p className="text-xs text-red-700 mt-1 mb-3">
                    Excluir sua conta removerá permanentemente todos os seus dados e livros
                  </p>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || isUploading}
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={12} className="mr-1.5 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 size={12} className="mr-1.5" />
                        Excluir Conta Permanentemente
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCloseAction}
            disabled={isUploading}
            className="text-sm font-medium"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUploading}
            className="bg-primary text-white text-sm font-medium"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
