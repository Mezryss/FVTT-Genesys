export type DragTransferData = {
	uuid: string;
	type?: string;
	genesysType?: string;
};

type PassengerExtraDragTransferData = {
	origin: 'passenger';
};

type RoleMemberExtraDragTransferData = {
	origin: 'role';
	roleId: string;
};

export type CrewExtraDragTransferData = PassengerExtraDragTransferData | RoleMemberExtraDragTransferData;

export type CrewDragTransferData = DragTransferData &
	Partial<CrewExtraDragTransferData> & {
		sourceVehicleUuid?: string;
	};

const GENESYS_DRAG_TYPE_PREFIX = 'genesys';

export function constructDragTransferTypeFromData(genesysType: string, uuid: ItemUUID | ActorUUID | TokenDocumentUUID) {
	return `${GENESYS_DRAG_TYPE_PREFIX}/${genesysType}/${uuid}`;
}

export function extractDataFromDragTransferTypes(dragTransferTypes?: readonly string[]) {
	if (dragTransferTypes) {
		const genesysDragType = dragTransferTypes.find((transferType) => transferType.indexOf(GENESYS_DRAG_TYPE_PREFIX) === 0);

		if (genesysDragType) {
			const genesysDataSections = genesysDragType.split('/');

			if (genesysDataSections.length === 3) {
				return {
					genesysType: genesysDataSections[1],
					uuid: genesysDataSections[2],
				};
			}
		}
	}

	return null;
}
