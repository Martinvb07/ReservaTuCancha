'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, Mail, Phone, Calendar, Edit,
  Trash2, Power, Plus, Search, Shield, User,
} from 'lucide-react';
import api from '@/lib/api/axios';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin';
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'admin';
  password?: string;
}

export default function AdminUsuariosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    name: '', email: '', phone: '', role: 'owner', password: '',
  });

  const { data: users = [], isLoading } = useQuery<UserData[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => api.post('/users/register', data),
    onSuccess: () => {
      toast.success('Usuario creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setCreateOpen(false);
      setFormData({ name: '', email: '', phone: '', role: 'owner', password: '' });
    },
    onError: (err: any) => toast.error(err.message || 'Error al crear usuario'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormData> }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => {
      toast.success('Usuario actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditUser(null);
    },
    onError: (err: any) => toast.error(err.message || 'Error al actualizar'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/toggle-status`),
    onSuccess: (_, id) => {
      const user = users.find(u => u._id === id);
      toast.success(`Usuario ${user?.isActive ? 'desactivado' : 'activado'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Error al cambiar estado'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('Usuario eliminado');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteUser(null);
    },
    onError: () => toast.error('Error al eliminar usuario'),
  });

  const handleEditOpen = (user: UserData) => {
    setEditUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
    });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Usuarios</h1>
            <p className="text-muted-foreground text-sm">
              {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white gap-2 rounded-full px-5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" /> Crear usuario
        </Button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-full"
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed rounded-2xl">
          <CardContent className="flex flex-col items-center py-12 gap-3">
            <Users className="h-10 w-10 text-muted-foreground opacity-30" />
            <p className="font-medium text-muted-foreground">
              {search ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <Card
              key={user._id}
              className={`border rounded-2xl transition-all ${!user.isActive ? 'opacity-60 bg-muted/30' : 'hover:shadow-sm'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">

                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{user.name}</span>

                      {/* ── Pill rol ── */}
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {user.role === 'admin'
                          ? <><Shield className="h-3 w-3" />Admin</>
                          : <><User className="h-3 w-3" />Propietario</>
                        }
                      </span>

                      {/* ── Pill estado ── */}
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />{user.email}
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />{user.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {user.createdAt && !isNaN(Date.parse(user.createdAt))
                          ? format(new Date(user.createdAt), "dd MMM yyyy", { locale: es })
                          : 'Fecha inválida'}
                      </span>
                      {user.lastLoginAt && (
                        <span className="text-muted-foreground/60">
                          Último acceso: {format(new Date(user.lastLoginAt), "dd MMM", { locale: es })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Botones circulares ── */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Editar */}
                    <button
                      onClick={() => handleEditOpen(user)}
                      title="Editar usuario"
                      className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>

                    {/* Activar / Desactivar */}
                    <button
                      onClick={() => toggleMutation.mutate(user._id)}
                      disabled={toggleMutation.isPending}
                      title={user.isActive ? 'Desactivar' : 'Activar'}
                      className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-150 ${
                        user.isActive
                          ? 'border-amber-200 bg-amber-50 text-amber-500 hover:bg-amber-100'
                          : 'border-green-200 bg-green-50 text-green-500 hover:bg-green-100'
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => setDeleteUser(user)}
                      title="Eliminar usuario"
                      className="w-9 h-9 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-all duration-150"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Modal Crear usuario ──────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Crear nuevo usuario</DialogTitle>
            <DialogDescription>
              Completa los datos para registrar un propietario o administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nombre completo</Label>
              <Input placeholder="Juan Pérez" value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="juan@email.com" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono (opcional)</Label>
              <Input type="tel" placeholder="+57 300 123 4567" value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">🏟️ Propietario</SelectItem>
                  <SelectItem value="admin">🛡️ Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white rounded-full"
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.name || !formData.email || !formData.password}
            >
              {createMutation.isPending ? 'Creando...' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Editar usuario ─────────────────────────── */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos de <strong>{editUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nombre completo</Label>
              <Input value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input type="tel" value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">🏟️ Propietario</SelectItem>
                  <SelectItem value="admin">🛡️ Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nueva contraseña <span className="text-muted-foreground text-xs">(dejar vacío para no cambiar)</span></Label>
              <Input type="password" placeholder="••••••••" value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setEditUser(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white rounded-full"
              onClick={() => {
                if (!editUser) return;
                const payload: any = { name: formData.name, phone: formData.phone, role: formData.role };
                if (formData.password) payload.password = formData.password;
                updateMutation.mutate({ id: editUser._id, data: payload });
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Alert Dialog Eliminar ────────────────────────── */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar a <strong>{deleteUser?.name}</strong> ({deleteUser?.email}).
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white rounded-full"
              onClick={() => deleteUser && deleteMutation.mutate(deleteUser._id)}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}