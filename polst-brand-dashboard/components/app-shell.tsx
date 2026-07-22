'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  Compass,
  Home,
  LayoutGrid,
  Lightbulb,
  Menu,
  Plus,
  Settings,
  Share2,
  Users,
  X,
} from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import { PolstLogo, PolstMark } from '@/components/polst-logo'
import { currentUser, organization } from '@/lib/data'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home', href: '/brand/home', icon: Home },
  {
    label: 'Decision Campaigns',
    href: '/brand/decision-campaigns',
    icon: LayoutGrid,
  },
  {
    label: 'Distribution',
    href: '/brand/decision-campaigns/holiday-creative/distribution',
    icon: Share2,
  },
  {
    label: 'Insights',
    href: '/brand/decision-campaigns/holiday-creative/insights',
    icon: Lightbulb,
  },
  { label: 'Audience', href: '/brand/audience', icon: Compass },
  { label: 'Team', href: '/brand/team', icon: Users },
  { label: 'Settings', href: '/brand/settings', icon: Settings },
]

const bottomNav = navItems.filter((n) =>
  ['Home', 'Decision Campaigns', 'Insights', 'Audience'].includes(n.label),
)

function isActive(pathname: string, href: string) {
  if (href === '/brand/home') return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

function SidebarNav({
  pathname,
  collapsed = false,
}: {
  pathname: string
  collapsed?: boolean
}) {
  return (
    <nav className={cn('flex flex-1 flex-col gap-1', collapsed ? 'px-2' : 'px-3')}>
      {navItems.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.label}
            href={item.href}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
            className={cn(
              'group relative flex items-center rounded-lg text-sm font-medium transition-colors',
              collapsed
                ? 'justify-center px-0 py-2.5'
                : 'gap-3 px-3 py-2',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            )}
          >
            <item.icon className="size-4.5 shrink-0" />
            {collapsed ? (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-md group-hover:block"
              >
                {item.label}
              </span>
            ) : (
              <span className="truncate">{item.label}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col bg-sidebar py-5 transition-[width] duration-200 lg:flex',
          collapsed ? 'w-[4.5rem]' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex items-center pb-6 text-sidebar-accent-foreground',
            collapsed ? 'justify-center px-0' : 'gap-2 px-6',
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <PolstMark className="size-4" />
          </span>
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight">
              Polst
            </span>
          )}
        </div>

        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
          className={cn(
            'mb-3 flex items-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            collapsed
              ? 'mx-2 justify-center py-2'
              : 'mx-3 gap-2 px-3 py-2 text-xs font-medium',
          )}
        >
          <ChevronLeft
            className={cn(
              'size-4.5 shrink-0 transition-transform',
              collapsed && 'rotate-180',
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>

        <SidebarNav pathname={pathname} collapsed={collapsed} />
        <div className={cn('mt-auto pt-4', collapsed ? 'px-2' : 'px-3')}>
          <div
            className={cn(
              'flex items-center rounded-lg bg-sidebar-accent/50',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
            )}
            title={collapsed ? `${currentUser.name} · ${currentUser.role}` : undefined}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              {currentUser.initials}
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                  {currentUser.name}
                </p>
                <p className="truncate text-xs text-sidebar-foreground">
                  {currentUser.role}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar py-5">
            <div className="flex items-center justify-between px-6 pb-6">
              <PolstLogo className="text-sidebar-accent-foreground" />
              <button
                onClick={() => setMobileOpen(false)}
                className="text-sidebar-foreground"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div onClick={() => setMobileOpen(false)}>
              <SidebarNav pathname={pathname} />
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div
        className={cn(
          'transition-[padding] duration-200',
          collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64',
        )}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
          <button
            className="text-foreground lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <LinkButton
              size="lg"
              href="/brand/new-polst"
              className="hidden sm:inline-flex"
            >
              <Plus className="size-4" />
              New Polst
            </LinkButton>
            <LinkButton
              size="icon-sm"
              variant="ghost"
              href="/brand/new-polst"
              className="sm:hidden"
              aria-label="New Polst"
            >
              <Plus className="size-5" />
            </LinkButton>
            <button
              className="relative grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="size-4.5" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            </button>
            <button className="hidden items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium hover:bg-muted sm:flex">
              <span className="grid size-5 place-items-center rounded bg-foreground text-[10px] font-bold text-background">
                N
              </span>
              {organization.name}
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
            <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {currentUser.initials}
            </span>
          </div>
        </header>

        <main className="px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-background/95 backdrop-blur lg:hidden">
        {bottomNav.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <item.icon className="size-5" />
              {item.label === 'Decision Campaigns' ? 'Campaigns' : item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
