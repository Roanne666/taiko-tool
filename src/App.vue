<style>
.n-layout-scroll-container {
  overflow-y: hidden;
}

.sider-enter-active,
.sider-leave-active {
  transition: all 0.25s;
}

.sider-enter-from,
.sider-leave-to {
  transform: translateX(-500px);
  opacity: 0;
}
</style>

<template>
  <n-layout has-sider style="padding-top: 20px; height: 99vh">
    <transition v-show="!hideSideBar" name="sider">
      <n-layout-sider bordered width="220" content-style="padding-left: 24px;padding-right:10px">
        <n-menu :options="menuOptions" default-value="score" />
      </n-layout-sider>
    </transition>

    <n-layout>
      <n-message-provider>
        <n-layout-content content-style="padding-left: 24px;padding-right:24px;height:100vh">
          <RouterView />
        </n-layout-content>
      </n-message-provider>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import "@/assets/base.css";
import { RouterLink, RouterView } from "vue-router";
import { NLayout, NLayoutSider, NLayoutContent, NMenu, type MenuOption, NIcon, NMessageProvider } from "naive-ui";
import {
  HomeOutline as HomeIcon,
  MusicalNotesOutline as MusicIcon,
  BarcodeOutline as PreviewIcon,
  CompassOutline as GuideIcon,
} from "@vicons/ionicons5";
import { Edit as EditIcon } from "@vicons/carbon";
import { h, type Component, Transition } from "vue";
import { fetchAllSongs } from "@/scripts/stores/song";
import { hideSideBar } from "./scripts/stores/global";

fetchAllSongs();

const menuOptions: MenuOption[] = [
  createMenuOption("使用指南", "/", GuideIcon),
  createMenuOption("乐曲成绩", "/score", MusicIcon),
  createMenuOption("谱面预览", "/preview", PreviewIcon),
  createMenuOption("谱面编辑", "/edit", EditIcon),
];

function createMenuOption(text: string, to: string, icon: Component) {
  return {
    label: () => h(RouterLink, { to }, { default: () => text }),
    key: to,
    icon: () => h(NIcon, null, { default: () => h(icon) }),
  };
}
</script>
