import GenesysItem from '@/item/GenesysItem';
import { DragTransferData, constructDragTransferTypeFromData } from '@/data/DragTransferData';

export default class GenesysItemDirectory extends ItemDirectory<GenesysItem> {
	protected override _onDragStart(event: ElementDragEvent): void {
		super._onDragStart(event);

		const dragData = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}') as DragTransferData;
		if (dragData.type === 'Item' && dragData.uuid) {
			const draggedItem = fromUuidSync(dragData.uuid) as { type: string } | null;
			if (draggedItem) {
				const genesysTransferType = constructDragTransferTypeFromData(draggedItem.type, dragData.uuid as ItemUUID);
				event.dataTransfer?.setData(genesysTransferType, '');
			}
		}
	}
}
