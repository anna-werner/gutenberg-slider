/**
 * External dependencies
 */

const {
    filter,
    every
} = lodash;

/**
 * WordPress dependencies
 */
const { __ } = wp.i18n;

/**
 * Internal dependencies
 */
const {
	registerBlockType,
	createBlock,
} = wp.blocks;

const {
    editorMediaUpload,
    RichText
} = wp.editor;

import { default as edit } from './edit';

const blockAttributes = {
	images: {
		type: 'array',
		default: [],
		source: 'query',
		selector: 'ul.wp-block-occ-slider .blocks-gallery-item',
		query: {
			url: {
				source: 'attribute',
				selector: 'img',
				attribute: 'src',
			},
			link: {
				source: 'attribute',
				selector: 'img',
				attribute: 'data-link',
			},
			alt: {
				source: 'attribute',
				selector: 'img',
				attribute: 'alt',
				default: '',
			},
			id: {
				source: 'attribute',
				selector: 'img',
				attribute: 'data-id',
			},
			caption: {
				type: 'array',
				source: 'children',
				selector: 'figcaption',
			},
		},
	},
	imageCrop: {
		type: 'boolean',
		default: true,
	},
	autoplay: {
		type: 'boolean',
		default: true,
	},
	speed: {
		type: 'string',
		default: '300',
	},
	effect: {
		type: 'string',
		default: 'fade',
	},
	linkTo: {
		type: 'string',
		default: 'none',
	},
};

export const name = 'occ/slider';

export const settings = {
	title: __( 'Slider', 'gutenberg-slider' ),
	description: __( 'Image silders are a great way to share groups of pictures on your site.', 'gutenberg-slider' ),
	icon: 'format-gallery',
	category: 'common',
	keywords: [ __( 'images' ), __( 'photos' ) ],
	attributes: blockAttributes,

	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ 'occ/slider' ],
				transform: ( attributes ) => {
					const validImages = filter( attributes, ( { id, url } ) => id && url );
					if ( validImages.length > 0 ) {
						return createBlock( 'occ/slider', {
							images: validImages.map( ( { id, url, alt, caption } ) => ( { id, url, alt, caption } ) ),
						} );
					}
					return createBlock( 'occ/slider' );
				},
			},
			{
				type: 'shortcode',
				tag: 'gallery',
				attributes: {
					images: {
						type: 'array',
						shortcode: ( { named: { ids } } ) => {
							if ( ! ids ) {
								return [];
							}

							return ids.split( ',' ).map( ( id ) => ( {
								id: parseInt( id, 10 ),
							} ) );
						},
					},
					linkTo: {
						type: 'string',
						shortcode: ( { named: { link = 'attachment' } } ) => {
							return link === 'file' ? 'media' : link;
						},
					},
				},
			},
			{
				type: 'files',
				isMatch( files ) {
					return files.length !== 1 && every( files, ( file ) => file.type.indexOf( 'image/' ) === 0 );
				},
				transform( files, onChange ) {
					const block = createBlock( 'occ/slider' );
					editorMediaUpload(
						files,
						( images ) => onChange( block.uid, { images } ),
						'image'
					);
					return block;
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/image' ],
				transform: ( { images } ) => {
					if ( images.length > 0 ) {
						return images.map( ( { id, url, alt, caption } ) => createBlock( 'core/image', { id, url, alt, caption } ) );
					}
					return createBlock( 'core/image' );
				},
			},
		],
	},

	edit: edit,

	save( { attributes } ) {
		const { images, imageCrop, autoplay, speed, effect, linkTo } = attributes;
		return (
			<ul className={ `${ imageCrop ? 'is-cropped' : '' }` } data-autoplay={ autoplay } data-speed={ speed } data-effect={ effect }>
				{ images.map( ( image ) => {
					let href;

					switch ( linkTo ) {
						case 'media':
							href = image.url;
							break;
						case 'attachment':
							href = image.link;
							break;
					}

					const img = <img src={ image.url } alt={ image.alt } data-id={ image.id } data-link={ image.link } />;

					return (
						<li key={ image.id || image.url } className="blocks-gallery-item">
							<figure>
								{ href ? <a href={ href }>{ img }</a> : img }
                                { image.caption && image.caption.length > 0 && (
                                    <RichText.Content tagName="figcaption" value={ image.caption } />
                                ) }
							</figure>
						</li>
					);
				} ) }
			</ul>
		);
	},
};

registerBlockType( name, settings );
