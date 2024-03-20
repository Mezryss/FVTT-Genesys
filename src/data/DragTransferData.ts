export type DragTransferData = {
	uuid?: string;
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
const UPPER_CASE_PATTERN = /([A-Z]+)/g;
const ENCODED_UPPER_CASE_PATTERN = /\|(\d+)\|/g;

function encodeUpperCase(text: string) {
	return text.replace(UPPER_CASE_PATTERN, (_match, group1: string) => `|${group1.codePointAt(0)}|`);
}

function decodeUpperCase(text: string) {
	return text.replace(ENCODED_UPPER_CASE_PATTERN, (_match, group1: string) => String.fromCodePoint(parseInt(group1, 10)));
}

export function constructDragTransferTypeFromData(genesysType: string, uuid: DocumentUUID) {
	return `${GENESYS_DRAG_TYPE_PREFIX}/${encodeUpperCase(genesysType)}/${encodeUpperCase(uuid)}`;
}

export function extractDataFromDragTransferTypes(dragTransferTypes?: readonly string[]) {
	if (dragTransferTypes) {
		const genesysDragType = dragTransferTypes.find((transferType) => transferType.indexOf(GENESYS_DRAG_TYPE_PREFIX) === 0);

		if (genesysDragType) {
			const genesysDataSections = decodeUpperCase(genesysDragType).split('/');

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
