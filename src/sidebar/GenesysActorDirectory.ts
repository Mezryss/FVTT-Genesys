import GenesysActor from '@/actor/GenesysActor';
import { DragTransferData, constructDragTransferTypeFromData } from '@/data/DragTransferData';

export default class GenesysActorDirectory extends ActorDirectory<GenesysActor> {
	protected override _onDragStart(event: ElementDragEvent): void {
		super._onDragStart(event);

		const dragData = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}') as DragTransferData;
		if (dragData.type === 'Actor' && dragData.uuid) {
			const draggedActor = fromUuidSync(dragData.uuid) as { type: string } | null;
			if (draggedActor) {
				const genesysTransferType = constructDragTransferTypeFromData(draggedActor.type, dragData.uuid as ActorUUID);
				event.dataTransfer?.setData(genesysTransferType, '');
			}
		}
	}
}
