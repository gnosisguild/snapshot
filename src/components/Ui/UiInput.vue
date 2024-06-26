<script setup lang="ts">
const props = defineProps<{
  modelValue?: string | number;
  placeholder?: string;
  error?: string | boolean;
  number?: boolean;
  disabled?: boolean;
  maxlength?: string | number;
  additionalInputClass?: string;
  focusOnMount?: boolean;
  readonly?: boolean;
  quickFix?(): void;
}>();

const emit = defineEmits(['update:modelValue', 'blur']);

function handleInput(e: Event) {
  const input = (e.target as HTMLInputElement).value;
  if (props.number) {
    return emit('update:modelValue', !input ? undefined : parseFloat(input));
  }
  emit('update:modelValue', input);
}

const inputRef = ref<null | HTMLInputElement>(null);

onMounted(() => {
  if (props.focusOnMount) {
    inputRef?.value?.focus();
  }
});
</script>

<template>
  <div class="w-full rounded-3xl">
    <div
      class="relative z-10 flex w-full rounded-3xl border border-skin-border bg-skin-bg px-3 text-left leading-[42px] outline-none transition-colors focus-within:border-skin-text"
      :class="{ '!border-red': !!error }"
    >
      <div class="mr-2 whitespace-nowrap text-skin-text">
        <slot name="label" />
      </div>
      <button
        v-if="$slots.selected"
        class="flex-auto overflow-x-auto whitespace-nowrap text-left text-skin-link outline-none"
        :class="{ 'cursor-not-allowed text-skin-border': disabled }"
      >
        <slot name="selected" />
      </button>
      <input
        v-else
        ref="inputRef"
        :value="modelValue"
        :placeholder="placeholder"
        :type="number ? 'number' : 'text'"
        :disabled="disabled"
        class="input w-full flex-auto"
        :class="[additionalInputClass, { 'cursor-not-allowed': disabled }]"
        :readonly="readonly"
        :maxlength="maxlength"
        @input="handleInput"
        @blur="emit('blur')"
      />
      <slot name="info" />
    </div>
    <div
      :class="[
        's-error relative z-0',
        !!error ? '-mt-[20px] opacity-100' : '-mt-[48px] opacity-0'
      ]"
    >
      <BaseIcon name="warning" class="text-red-500 mr-2" />
      <!-- The fact that error can be bool or string makes this necessary -->
      {{ error || '' }}
      <!-- Allow parent to format value with action -->
      <button v-if="quickFix" class="ml-auto" @click="quickFix">
        Quick Fix
        <i-ho-sparkles class="inline" />
      </button>
    </div>
  </div>
</template>
