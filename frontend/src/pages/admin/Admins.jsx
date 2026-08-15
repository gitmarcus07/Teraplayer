import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Shield, Plus, KeyRound, Trash2, UserCog, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  listAdmins,
  createAdmin,
  updateAdmin,
  setAdminPassword,
  deleteAdmin,
} from "@/services/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const emptyForm = { email: "", password: "", name: "", role: "ADMIN" };

export default function Admins() {
  const [admins, setAdmins] = useState(null);
  const [error, setError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "ADMIN" });

  const [pwdTarget, setPwdTarget] = useState(null);
  const [pwdValue, setPwdValue] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    listAdmins()
      .then((data) => setAdmins(data.admins))
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load admins"));
  }, []);

  useEffect(load, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      await createAdmin({ ...createForm, name: createForm.name || null });
      toast.success("Admin created");
      setCreateOpen(false);
      setCreateForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not create admin");
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    try {
      await updateAdmin(editTarget.admin_id, editForm);
      toast.success("Admin updated");
      setEditTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not update admin");
    }
  }

  async function handlePassword(e) {
    e.preventDefault();
    if (savingPwd) return;
    setSavingPwd(true);
    try {
      await setAdminPassword(pwdTarget.admin_id, pwdValue);
      toast.success("Password updated");
      setPwdTarget(null);
      setPwdValue("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not update password");
    } finally {
      setSavingPwd(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAdmin(deleteTarget.admin_id);
      toast.success("Admin deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not delete admin");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Admins | TeraPlayer Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Admins</h1>
            <p className="text-sm text-muted-foreground">Manage control-center access. Super admin only.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add admin
          </Button>
        </div>

        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : !admins ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Accounts
              </CardTitle>
              <CardDescription>{admins.length} admin(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {admins.map((admin) => (
                <div key={admin.admin_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{admin.name || admin.email}</span>
                      <Badge variant={admin.role === "SUPER_ADMIN" ? "default" : "secondary"} className="text-[10px]">
                        {admin.role === "SUPER_ADMIN" ? "SUPER ADMIN" : "ADMIN"}
                      </Badge>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditTarget(admin);
                        setEditForm({ name: admin.name || "", role: admin.role });
                      }}
                    >
                      <UserCog className="mr-1.5 h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPwdTarget(admin);
                        setPwdValue("");
                      }}
                    >
                      <KeyRound className="mr-1.5 h-4 w-4" /> Password
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(admin)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {!admins.length && <p className="text-sm text-muted-foreground">No admins yet.</p>}
            </CardContent>
          </Card>
        )}

        {/* Create */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add admin</DialogTitle>
              <DialogDescription>Create a new control-center account.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adm-email">Email</Label>
                <Input
                  id="adm-email"
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adm-name">Name (optional)</Label>
                <Input
                  id="adm-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adm-password">Password (min 8 chars)</Label>
                <Input
                  id="adm-password"
                  type="password"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={createForm.role === "ADMIN" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCreateForm((f) => ({ ...f, role: "ADMIN" }))}
                  >
                    Admin
                  </Button>
                  <Button
                    type="button"
                    variant={createForm.role === "SUPER_ADMIN" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCreateForm((f) => ({ ...f, role: "SUPER_ADMIN" }))}
                  >
                    Super Admin
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit */}
        <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit admin</DialogTitle>
              <DialogDescription>{editTarget?.email}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ed-name">Name</Label>
                <Input
                  id="ed-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={editForm.role === "ADMIN" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditForm((f) => ({ ...f, role: "ADMIN" }))}
                  >
                    Admin
                  </Button>
                  <Button
                    type="button"
                    variant={editForm.role === "SUPER_ADMIN" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditForm((f) => ({ ...f, role: "SUPER_ADMIN" }))}
                  >
                    Super Admin
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Password */}
        <Dialog open={!!pwdTarget} onOpenChange={(o) => !o && setPwdTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset password</DialogTitle>
              <DialogDescription>New password for {pwdTarget?.email}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pw">New password (min 8 chars)</Label>
                <Input
                  id="pw"
                  type="password"
                  required
                  minLength={8}
                  value={pwdValue}
                  onChange={(e) => setPwdValue(e.target.value)}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={savingPwd}>
                  {savingPwd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete admin?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes {deleteTarget?.email} and invalidates their sessions. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}