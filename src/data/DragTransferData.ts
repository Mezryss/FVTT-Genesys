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
