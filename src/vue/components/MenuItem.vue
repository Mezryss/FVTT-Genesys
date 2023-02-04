<template>
	<a class="menu-item">
		<div class="menu-icon">
			<slot name="icon">
				<i class="fas fa-caret-right"></i>
			</slot>
		</div>

		<div class="menu-label">
			<slot>Unlabeled</slot>
		</div>
	</a>
</template>

<style lang="scss" scoped>
.menu-item {
	display: flex;
	flex-direction: row;
	flex-wrap: nowrap;
	align-items: center;
	gap: 0.25em;
	padding-left: 0.25em;
	padding-right: 0.25em;
}

.menu-icon {
	min-width: 1.25em;
}
</style>
