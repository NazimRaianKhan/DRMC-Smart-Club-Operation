import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/forms";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, EmptyState, Skeleton, ProgressBar, Spinner } from "@/components/ui/misc";

export default function DevComponentsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="p-12 space-y-12 max-w-5xl mx-auto pb-32">
      <h1 className="text-3xl font-bold font-heading mb-8">UI Components Gallery</h1>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button loading>Loading...</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">Badges</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="outline">Outline</Badge>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          <StatusBadge status="confirmed" />
          <StatusBadge status="waitlisted" />
          <StatusBadge status="cancelled" />
          <StatusBadge status="rejected" />
          <StatusBadge status="checked_in" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">Forms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" className="mt-1" />
              <FieldError error="Please enter a valid email." />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" placeholder="Tell us about yourself..." className="mt-1" />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select id="role" className="mt-1">
                <option>Developer</option>
                <option>Designer</option>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Accept terms and conditions</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms2" disabled />
              <Label htmlFor="terms2">Disabled Checkbox</Label>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">Cards & Misc</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-2">Card Title</h3>
            <p className="text-text-muted text-sm">This is a card with some nice styling and inner glow on hover.</p>
          </Card>
          
          <EmptyState title="No items found" description="Get started by creating a new item." />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">Progress & Loaders</h2>
        <div className="space-y-6 max-w-md">
          <ProgressBar value={45} />
          <div className="flex gap-4">
            <Spinner />
            <span className="text-sm text-text-muted">Loading data...</span>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">Pagination</h2>
        <Pagination currentPage={2} totalPages={10} />
      </section>
    </div>
  );
}
