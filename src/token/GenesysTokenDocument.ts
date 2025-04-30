import GenesysActor from '@/actor/GenesysActor';

export type TokenAttributeDetails =
	| {
			label: string;
			isBar: true;
			editable: boolean;
			valuePath: string;
			maxPath: string;
	  }
	| {
			label: string;
			isBar: false;
			editable: boolean;
			valuePath: string;
	  };

export type DataModelWithTokenAttributes = Function & { tokenAttributes?: Record<string, TokenAttributeDetails> };

type TrackedAttributes = TokenAttributes & {
	source?: Record<string, TokenAttributeDetails>;
};

export default class GenesysTokenDocument extends TokenDocument<GenesysActor> {
	override getBarAttribute(barName: string, options: { alternative?: string } = {}) {
		const attribute: string | undefined = options.alternative || (this as Record<string, any>)[barName]?.attribute;
		if (!this.actor || !attribute) {
			return null;
		}

		const tokenAttributes = (this.actor.systemData.constructor as DataModelWithTokenAttributes).tokenAttributes;
		if (!tokenAttributes) {
			return super.getBarAttribute(barName, options);
		}

		const system = this.actor.systemData;
		const targetAttribute = tokenAttributes[attribute] as TokenAttributeDetails | undefined;
		if (!targetAttribute) {
			return null;
		}

		const dataValue = foundry.utils.getProperty(system, targetAttribute.valuePath);
		if (!Number.isNumeric(dataValue)) {
			return null;
		}

		const barAttribute: TokenResourceData = {
			type: 'value',
			attribute: attribute,
			editable: targetAttribute.editable,
			value: Number(dataValue),
		};

		if (targetAttribute.isBar) {
			const dataMax = foundry.utils.getProperty(system, targetAttribute.maxPath);
			if (!Number.isNumeric(dataMax)) {
				return null;
			}

			barAttribute.type = 'bar';
			barAttribute.max = Number(dataMax);
		}

		return barAttribute;
	}

	static override getTrackedAttributes(data?: Record<string, unknown>, _path?: string[]): TrackedAttributes {
		if (foundry.utils.isSubclass(data?.constructor, foundry.abstract.DataModel)) {
			const tokenAttributes = (data!.constructor as DataModelWithTokenAttributes).tokenAttributes;
			if (tokenAttributes) {
				return {
					bar: [],
					value: [],
					source: tokenAttributes,
				};
			}
		}

		return super.getTrackedAttributes(data, _path);
	}

	static override getTrackedAttributeChoices(attributes: TrackedAttributes): TokenAttributeChoices[] {
		attributes = attributes || this.getTrackedAttributes();
		const barGroup = game.i18n.localize('TOKEN.BarAttributes');
		const valueGroup = game.i18n.localize('TOKEN.BarValues');

		if (attributes.source) {
			const trackedAttributes = Object.entries(attributes.source).reduce((accum, [attributeId, attributeDetails]) => {
				accum.push({
					group: attributeDetails.isBar ? barGroup : valueGroup,
					label: attributeDetails.label,
					value: attributeId,
				});
				return accum;
			}, [] as TokenAttributeChoices[]);
			trackedAttributes.sort((left, right) => {
				if (left.group !== right.group) {
					return left.group === barGroup ? -1 : 1;
				} else {
					return left.label.compare(right.label);
				}
			});

			return trackedAttributes;
		} else {
			return super.getTrackedAttributeChoices(attributes);
		}
	}
}
