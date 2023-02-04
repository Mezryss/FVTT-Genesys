<script lang="ts" setup>
import { onMounted, onUpdated, ref } from 'vue';

const props = defineProps<{
	value: string;
}>();

const enrichedContent = ref(props.value);

async function enrichContent() {
	enrichedContent.value = await TextEditor.enrichHTML(props.value, { async: true });
}

onMounted(enrichContent);
onUpdated(enrichContent);
</script>

<template>
	<div v-html="enrichedContent"></div>
</template>
