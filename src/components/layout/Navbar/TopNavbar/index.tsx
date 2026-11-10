"use client";

import { cn } from "@/lib/utils";
import { satoshi } from "@/styles/fonts";
import Link from "next/link";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { NavMenu } from "../navbar.types";
import { MenuList } from "./MenuList";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { MenuItem } from "./MenuItem";
import Image from "next/image";
import InputGroup from "@/components/ui/input-group";
import ResTopNavbar from "./ResTopNavbar";
import CartBtn from "./CartBtn";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { LogOut, ChevronDown, Clock, Search as SearchIcon, X, User } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useFilter } from '@/context/FilterContext';
import { Product } from '@/types/product';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ProductImage } from '@/components/ui/ProductImage'
import { useAuth } from '@/context/AuthContext';
import LoginModal from "@/components/auth/LoginModal";

const getProductFinalPrice = (product: Product) => {
  const base = typeof product.price === "number" ? product.price : 0;
  const percentage = product.discount?.percentage ?? 0;
  const amount = product.discount?.amount ?? 0;

  if (percentage > 0) {
    const final = base * (1 - percentage / 100);
    return Math.max(0, Math.round(final * 100) / 100);
  }

  if (amount > 0) {
    return Math.max(0, Math.round((base - amount) * 100) / 100);
  }

  return base;
};

const DropdownContent = motion(DropdownMenu.Content);
const MAX_RECENT_SEARCHES = 5;

const SearchModal = ({
  isOpen,
  onClose,
  searchTerm,
  setSearchTerm,
  filteredProducts,
  isSearchLoading,
  recentSearches,
  removeFromRecentSearches,
  handleNavigation,
  addToRecentSearches
}: {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredProducts: Product[];
  isSearchLoading: boolean;
  recentSearches: string[];
  removeFromRecentSearches: (term: string) => void;
  handleNavigation: (url: string) => void;
  addToRecentSearches: (term: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleProductSelection = async (url: string, term: string) => {
    setIsNavigating(true);
    try {
      addToRecentSearches(term);
      await handleNavigation(url);
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="fixed inset-0 bg-[rgb(var(--surface))] z-[100] flex flex-col"
        >
          {/* Overlay de carga */}
          <AnimatePresence>
            {isNavigating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/90 z-10 flex items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="w-12 h-12 border-3 border-black/10 border-t-black border-r-black rounded-full"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cabecera */}
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 border-b border-black/10"
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <InputGroup className="bg-black/5">
                  <InputGroup.Text>
                    <SearchIcon className="w-5 h-5 text-black/60" />
                  </InputGroup.Text>
                  <InputGroup.Input
                    ref={inputRef}
                    type="search"
                    name="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Decks, Wallpanels, Placas..."
                    className="bg-transparent placeholder:text-black/40"
                    autoComplete="off"
                    disabled={isNavigating}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                      disabled={isNavigating}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </InputGroup>
              </div>
              <button 
                onClick={onClose}
                className="text-black/60 hover:text-black transition-colors px-2 py-1"
                disabled={isNavigating}
              >
                Cancelar
              </button>
            </div>
          </motion.div>

          {/* Cuerpo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 overflow-y-auto"
          >
            {!searchTerm ? (
              <div className="p-4">
                <h3 className="text-sm font-medium text-black/80 mb-3">Búsquedas recientes</h3>
                {recentSearches.length > 0 ? (
                  <div className="space-y-2">
                    {recentSearches.map((term) => (
                      <motion.div 
                        key={term}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-between"
                      >
                        <button
                          onClick={() => setSearchTerm(term)}
                          className="flex items-center gap-3 text-black/80 hover:text-black transition-colors py-2 w-full text-left"
                          disabled={isNavigating}
                        >
                          <Clock className="w-4 h-4 text-black/40 flex-shrink-0" />
                          <span className="truncate">{term}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromRecentSearches(term);
                          }}
                          className="p-1 text-black/30 hover:text-black/60 transition-colors"
                          disabled={isNavigating}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-black/40 text-sm">No hay búsquedas recientes</p>
                )}
              </div>
            ) : isSearchLoading ? (
              <div className="flex justify-center items-center h-32">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-6 h-6 border-2 border-black/10 border-t-black/60 rounded-full"
                />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="divide-y divide-black/5">
                {filteredProducts.map((product) => (
                  <motion.button
                    key={product.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleProductSelection(
                        `/shop/product/${product.id}/${encodeURIComponent(product.name.toLowerCase().replace(/\s+/g, '-'))}`,
                        searchTerm
                      );
                    }}
                    className="w-full flex items-center gap-3 p-4 hover:bg-black/5 active:bg-black/10 transition-colors"
                    disabled={isNavigating}
                  >
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-black/5 flex-shrink-0">
                      <ProductImage
                        src={product.images[0] || '/placeholder.png'}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="rounded-md"
                        variant="search"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-black truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-black/60 mt-0.5 truncate">
                        {product.category}
                        {product.subcategory && ` • ${product.subcategory}`}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-sm font-medium text-black">
                        ${getProductFinalPrice(product).toLocaleString()}
                      </span>
                    </div>
                  </motion.button>
                ))}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleProductSelection(
                      `/shop?search=${encodeURIComponent(searchTerm)}`,
                      searchTerm
                    );
                  }}
                  className="w-full py-3 text-center text-sm font-medium text-black/80 hover:text-black transition-colors"
                  disabled={isNavigating}
                >
                  Ver todos los resultados para &quot;{searchTerm}&quot;
                </motion.button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-32 text-black/40"
              >
                <SearchIcon className="w-6 h-6 mb-2" />
                <p>No se encontraron resultados</p>
                <p className="text-xs mt-1">&quot;{searchTerm}&quot;</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const TopNavbar = () => {
  const { user, signOut, isLoading } = useAuth();
  const { cart, loading: cartLoading, totalQuantity } = useCart();
  const { products, categories, getSubcategoriesForCategory, getWoodTypesForCategory } = useFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isDetached, setIsDetached] = useState(false);
  const navControls = useAnimation();
  const wasDetachedRef = useRef(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isRouting, setIsRouting] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = `${pathname}${searchParams && searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginRedirect, setLoginRedirect] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (params.get("login") === "open") {
        params.delete("login");
        params.delete("redirect");
      }
      const sanitized = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      if (sanitized.trim()) sessionStorage.setItem("last_path", sanitized);
    } catch {}
  }, [pathname, searchParams]);

  const navData: NavMenu = useMemo(() => {
    const encodeQP = (s: string) => encodeURIComponent(s).replace(/%20/g, "+");
    let nextId = 1;
    const items: NavMenu = [];

    if (categories && categories.length > 0) {
      categories.forEach((category) => {
        const isMaderas = category.trim().toLowerCase() === "maderas";
        const childrenRaw = isMaderas
          ? getWoodTypesForCategory("Maderas")
          : getSubcategoriesForCategory(category);

        const children = (childrenRaw || [])
          .filter(Boolean)
          .slice()
          .sort((a, b) => a.localeCompare(b, "es"));

        if (children.length > 0) {
          items.push({
            id: nextId++,
            type: "MenuList",
            label: category,
            url: `/shop?category=${encodeQP(category)}`,
            children: children.map((child, idx) => ({
              id: nextId * 1000 + idx,
              label: child,
              url: isMaderas
                ? `/shop?madera=${encodeQP(child)}`
                : `/shop?category=${encodeQP(category)}&subcategory=${encodeQP(child)}`,
              description: "",
            })),
          });
        } else {
          items.push({
            id: nextId++,
            type: "MenuItem",
            label: category,
            url: `/shop?category=${encodeQP(category)}`,
            children: [],
          });
        }
      });
    }

    items.push({
      id: nextId++,
      type: "MenuItem",
      label: "Nosotros",
      url: "/#nosotros",
      children: [],
    });

    // Oculto temporalmente: Obras y Donde estamos

    return items;
  }, [categories, getSubcategoriesForCategory, getWoodTypesForCategory]);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    }
    return [];
  });

  useEffect(() => {
    if (isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileSearchOpen]);

  useEffect(() => {
    const onScroll = () => {
      setIsDetached(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isDetached === wasDetachedRef.current) return;
    if (isDetached) {
      navControls.start({
        y: [-12, 0],
        scale: [0.985, 1],
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      });
    } else {
      navControls.start({
        y: [10, 0],
        scale: [1, 1],
        transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] },
      });
    }
    wasDetachedRef.current = isDetached;
  }, [isDetached, navControls]);

  const addToRecentSearches = (term: string) => {
    if (!term.trim()) return;
    
    const updated = [
      term,
      ...recentSearches.filter(item => item !== term)
    ].slice(0, MAX_RECENT_SEARCHES);
    
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const removeFromRecentSearches = (term: string) => {
    const updated = recentSearches.filter(item => item !== term);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts([]);
      return;
    }

    setIsSearchLoading(true);
    const timer = setTimeout(() => {
      const searchResults = products
        .filter(product => {
          const searchLower = searchTerm.toLowerCase();
          return (
            product.name.toLowerCase().includes(searchLower) ||
            product.category.toLowerCase().includes(searchLower) ||
            product.subcategory?.toLowerCase().includes(searchLower)
          );
        })
        .slice(0, 5);

      setFilteredProducts(searchResults);
      setIsSearchLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, products]);

  const handleNavigation = async (url: string) => {
    try {
      setIsRouting(true);
      await router.push(url);
      setIsMobileSearchOpen(false);
      setSearchTerm('');
      setIsSearchOpen(false);
    } catch (error) {
      console.error('Error durante la navegación:', error);
    } finally {
      setIsRouting(false);
    }
  };

  const totalItems = totalQuantity;

  useEffect(() => {
    if (!searchParams) return;
    const flag = searchParams.get('login');
    const red = searchParams.get('redirect');
    if (flag === 'open') {
      setIsLoginOpen(true);
      setLoginRedirect(red || currentUrl || '/');
    }
  }, [searchParams, currentUrl]);

  useEffect(() => {
    const handler = (e: any) => {
      const red = e?.detail?.redirect || currentUrl || '/';
      setLoginRedirect(red);
      setIsLoginOpen(true);
    };
    window.addEventListener('open-login', handler as any);
    return () => window.removeEventListener('open-login', handler as any);
  }, [currentUrl]);

  return (
    <nav className={cn(
      "relative z-30 px-2 md:px-4",
      isDetached ? "pt-2 md:pt-3" : "pt-0 md:pt-0"
    )}>
      <motion.div
        animate={navControls}
        className={cn(
        "flex relative max-w-frame mx-auto items-center justify-between rounded-full transition-all duration-500 ease-out",
        "hover:-translate-y-[1px]",
        isDetached
          ? "py-2.5 md:py-3 px-3 md:px-4 xl:px-5 bg-[rgb(var(--surface))] border border-[rgb(var(--brand-600)/0.16)] shadow-[0_14px_36px_rgba(0,0,0,0.14)] hover:shadow-[0_18px_44px_rgba(0,0,0,0.18)]"
          : "py-3 md:py-3.5 px-3 md:px-4 xl:px-5 bg-[rgb(var(--page-bg))] border border-transparent shadow-none"
      )}>
        <div className="flex items-center">
          <div className="block md:hidden mr-4">
            <ResTopNavbar data={navData} />
          </div>
          <Link href="/" className="mr-3 lg:mr-10">
            <Image
              src="/images/nativa_logo.png"
              alt="Nativa Revestimientos"
              width={160}
              height={48}
              priority
            />
          </Link>
        </div>

        <NavigationMenu withViewport={false} className="hidden md:flex mr-2 lg:mr-7">
          <NavigationMenuList>
            {navData.map((item) => (
              <React.Fragment key={item.id}>
                {item.type === "MenuItem" && (
                  <MenuItem label={item.label} url={item.url} />
                )}
                {item.type === "MenuList" && (
                  <MenuList data={item.children as any} label={item.label} />
                )}
              </React.Fragment>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div ref={searchRef} className="hidden md:block relative flex-1 max-w-xl">
          <InputGroup className="bg-black/5 mr-3 lg:mr-10">
            <InputGroup.Text>
              <SearchIcon className="w-5 h-5 text-black/60" />
            </InputGroup.Text>
            <InputGroup.Input
              type="search"
              name="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Decks, Wallpanels, Placas..."
              className="bg-transparent placeholder:text-black/40"
            />
          </InputGroup>

          {isSearchOpen && filteredProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-50 w-full mt-2 bg-[rgb(var(--surface))] rounded-lg shadow-lg border border-[rgb(var(--brand-600)/0.16)] overflow-hidden"
            >
              <div className="py-1">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/shop/product/${product.id}/${encodeURIComponent(product.name.toLowerCase().replace(/\s+/g, '-'))}`}
                    onClick={() => {
                      setSearchTerm('');
                      setIsSearchOpen(false);
                    }}
                    className="block px-4 py-3 flex items-center gap-3 hover:bg-black/5 transition-colors"
                  >
                    <div className="relative w-10 h-10 rounded overflow-hidden bg-black/5 flex-shrink-0">
                      <ProductImage
                        src={product.images[0] || '/placeholder.png'}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="rounded-md"
                        variant="search"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-black truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-black/60 truncate">
                        {product.category}
                        {product.subcategory && ` • ${product.subcategory}`}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-sm font-medium text-black">
                        ${getProductFinalPrice(product).toLocaleString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="p-1.5 md:hidden text-black/60 hover:text-black transition-colors"
          >
            <SearchIcon className="w-5 h-5" />
          </button>

          <SearchModal
            isOpen={isMobileSearchOpen}
            onClose={() => {
              setIsMobileSearchOpen(false);
              setSearchTerm('');
            }}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredProducts={filteredProducts}
            isSearchLoading={isSearchLoading}
            recentSearches={recentSearches}
            removeFromRecentSearches={removeFromRecentSearches}
            handleNavigation={handleNavigation}
            addToRecentSearches={addToRecentSearches}
          />

          {cartLoading ? (
            <div className="w-6 h-6 border-2 border-black/10 border-t-black/60 rounded-full animate-spin" />
          ) : (
            <CartBtn totalItems={totalItems} />
          )}

          {user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-1 p-1 group rounded-full hover:scale-105 transition-transform focus:outline-none">
                  {String((user as any)?.photoURL || "").trim() ? (
                    <Image
                      src={String((user as any)?.photoURL || "").trim()}
                      alt={String((user as any)?.displayName || user?.email || "avatar")}
                      width={36}
                      height={36}
                      className="rounded-full border border-black/10 group-hover:ring-2 group-hover:ring-black/10 transition-all"
                    />
                  ) : (
                    <span className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-black font-bold text-lg">
                      {String((user as any)?.displayName || user?.email || "U")
                        .trim()
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>
                  )}
                  <ChevronDown className="text-black/60 w-4 h-4 group-hover:rotate-180 transition-transform" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={8}
                  className="z-40 w-48 rounded-lg bg-white shadow-lg border border-black/10 p-1 text-sm"
                >
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded-md transition-colors duration-150"
                    >
                      <User className="w-4 h-4" />
                      Mi cuenta
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/orders"
                      className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded-md transition-colors duration-150"
                    >
                      <Image src="/icons/orders.svg" alt="orders" width={20} height={20} />
                      Mis Pedidos
                    </Link>
                  </DropdownMenu.Item>
                  
                  <DropdownMenu.Separator className="h-px my-1 bg-black/10" />
                  <DropdownMenu.Item
                    onSelect={() => signOut()}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 rounded-md cursor-pointer text-black/80 transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="p-1 rounded-full hover:scale-105 transition-transform"
                aria-label="Ingresar"
              >
                <Image
                  priority
                  src="/icons/user.svg"
                  height={24}
                  width={24}
                  alt="user"
                  className="max-w-[22px] max-h-[22px] text-black/60"
                />
              </button>
              <LoginModal open={isLoginOpen} onOpenChange={setIsLoginOpen} redirectTo={loginRedirect || currentUrl || '/'} />
            </>
          )}
        </div>
      </motion.div>
    </nav>
  );
};

export default TopNavbar;
