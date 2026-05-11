<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getServiceBaseURL } from '@/utils/service';
import { useAppStore } from '@/store/modules/app';

const CACHE_KEY = 'site_config_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 1天

interface SiteConfigCache {
  adminLogo: string;
  siteName: string;
  expireAt: number;
}

function readCache(): SiteConfigCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: SiteConfigCache = JSON.parse(raw);
    if (Date.now() > cache.expireAt) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cache;
  } catch {
    return null;
  }
}

function writeCache(adminLogo: string, siteName: string) {
  const cache: SiteConfigCache = {
    adminLogo,
    siteName,
    expireAt: Date.now() + CACHE_TTL
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

const adminLogoUrl = ref('');
const appStore = useAppStore();

// 先从缓存读取，避免闪烁
const cached = readCache();
if (cached) {
  adminLogoUrl.value = cached.adminLogo;
  if (cached.siteName) appStore.siteName = cached.siteName;
}

onMounted(async () => {
  // 有有效缓存则不请求
  if (readCache()) return;

  try {
    const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
    const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
    const res = await fetch(`${baseURL}/site-config`);
    const json = await res.json();
    if (json.code === 0 && json.data) {
      const logo = json.data.admin_logo || '';
      const name = json.data.site_name || '';
      adminLogoUrl.value = logo;
      if (name) appStore.siteName = name;
      writeCache(logo, name);
    }
  } catch {
    // 静默失败
  }
});
</script>

<template>
  <div class="app-logo">
    <img
      v-if="adminLogoUrl"
      :src="adminLogoUrl"
      style="width: 100%; height: 100%; object-fit: contain;"
      alt="logo"
    />
    <svg
      v-else
      width="100%"
      height="100%"
      version="1.1"
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <g>
        <path d="M 200,866 C 100,866 50,779.4 100,692.8 L 200,519.6 C 220,485 240,490 265,499.6 S 360,542.68 360,542.68 C 480.5,601 498,642.5 500,720 C 498,811 462,856 420,866" fill="url(#LogoGrad1)" fill-rule="nonzero" opacity="1" stroke="none" />
        <path d="M 420,866 C 455,861 478,846 500,827 C 614,696 615,597 500,517 C 394,444 333,374 380,207.82 L 260,415.67 C 240.22,450 254.37,465.1 275.28,481.79 S 360,542.68 360,542.68 C 480.5,601 498,642.5 500,720 C 498,811 462,856 420,866" fill="url(#LogoGrad2)" fill-rule="nonzero" opacity="1" stroke="none" />
        <path d="M 500,517 C 394,444 333,374 380,207.82 L 400,173.2 C 367,295 421,350 603,428 C 572,440 524,474 500,517" fill="url(#LogoGrad3)" fill-rule="nonzero" opacity="1" stroke="none" />
        <path d="M 500,827 L 660,660 C 738,589 710,482 603,428 C 572,440 524,474 500,517 C 615,597 614,696 500,827" fill="url(#LogoGrad4)" fill-rule="nonzero" opacity="1" stroke="none" />
        <path d="M 400,173.2 C 367,295 421,350 603,428 C 690,389, 750,445 788,500 L 600,173.2 C 550,86.6 450,86.6 400,173.2" fill="url(#LogoGrad5)" fill-rule="nonzero" opacity="1" stroke="none" />
        <path d="M 500,827 L 660,660 C 738,589 710,482 603,428 C 690,389, 750,445 788,500 C 816,554 797,606 750,640 L 500,827" fill="url(#LogoGrad6)" fill-rule="nonzero" opacity="1" stroke="none" />
        <path d="M 788,500 C 816,554 797,606 750,640 L 500,827 C 497,851 513,862 540,866 L 800,866 C 900,866 950,779.4 900,692.8 L 788,500" fill="url(#LogoGrad7)" fill-rule="nonzero" opacity="1" stroke="none" />
      </g>
      <defs>
        <linearGradient id="LogoGrad1" gradientTransform="matrix(104.391 -73.3432 73.3432 104.391 277.441 710.122)" gradientUnits="userSpaceOnUse" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="var(--logo-color-700)" /><stop offset="1" stop-color="var(--logo-color-600)" />
        </linearGradient>
        <linearGradient id="LogoGrad2" gradientTransform="matrix(-173.747 557.324 -557.324 -173.747 508.829 258.172)" gradientUnits="userSpaceOnUse" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="var(--logo-color-300)" /><stop offset="1" stop-color="var(--logo-color-500)" />
        </linearGradient>
        <linearGradient id="LogoGrad3" gradientTransform="matrix(157.951 295.666 -295.666 157.951 382.944 193.642)" gradientUnits="userSpaceOnUse" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="var(--logo-color-600)" /><stop offset="1" stop-color="var(--logo-color-700)" />
        </linearGradient>
        <linearGradient id="LogoGrad4" gradientTransform="matrix(-44.3023 219.578 -219.578 -44.3023 619.69 469.652)" gradientUnits="userSpaceOnUse" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="var(--logo-color-400)" /><stop offset="1" stop-color="var(--logo-color-600)" />
        </linearGradient>
        <linearGradient id="LogoGrad5" gradientTransform="matrix(125.52 334.256 -334.256 125.52 539.723 235.139)" gradientUnits="userSpaceOnUse" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="var(--logo-color-500)" /><stop offset="1" stop-color="var(--logo-color-300)" />
        </linearGradient>
        <linearGradient id="LogoGrad6" gradientTransform="matrix(-241.23 357.206 -357.206 -241.23 754.054 449.312)" gradientUnits="userSpaceOnUse" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="var(--logo-color-300)" /><stop offset="1" stop-color="var(--logo-color-500)" />
        </linearGradient>
        <linearGradient id="LogoGrad7" gradientTransform="matrix(125.978 210.065 -210.065 125.978 596.433 613.665)" gradientUnits="userSpaceOnUse" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="var(--logo-color-700)" /><stop offset="1" stop-color="var(--logo-color-600)" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<style scoped>
.app-logo {
  --logo-color-300: rgb(var(--primary-300-color));
  --logo-color-400: rgb(var(--primary-400-color));
  --logo-color-500: rgb(var(--primary-500-color));
  --logo-color-600: rgb(var(--primary-600-color));
  --logo-color-700: rgb(var(--primary-700-color));
}
</style>
