'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const url = require( 'url' );
const utils = require( '../lib/utils' );
const libxmljs = require( 'libxmljs' );
// const debug = require( 'debug' )( 'Xform model' );
const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
    projectId: "upsmf-368011",
    keyFilename: "keys/service-account-key.json"
  });

const GCS_BUCKET_NAME =  "dev-public-upsmf";
// TODO move
const FORMSTORAGEPATH = path.resolve( __dirname, '../../storage/forms' );
const bucket = storage.bucket(GCS_BUCKET_NAME);

class Xform {

    constructor( id ) {
        this.id = id;
        // this.path = path.join( FORMSTORAGEPATH, id + '.xml' );
        // this.path = `https://storage.googleapis.com/${GCS_BUCKET_NAME}`, `${this.id}.xml`;
    }

    // initialize() {
    //     const xform = this;
    //     return new Promise( function( resolve, reject ) {
    //         // mimicking future async db query
    //         fs.readFile( xform.path, 'utf-8', ( error, data ) => {
    //             if ( error ) {
    //                 reject( error );
    //             } else {
    //                 xform.data = data;
    //                 //that.data = '<data>dfdsa';
    //                 try {
    //                     xform.doc = libxmljs.parseXml( xform.data );
    //                     xform.namespaces = xform._getNamespaces();
    //                     //debug( 'defaultNamespace', JSON.stringify( that.defaultNamespace[ 0 ] ) );
    //                     resolve( true );
    //                 } catch ( e ) {
    //                     const err = new Error( 'XML Error in form "' + xform.id + '": ' + JSON.stringify( e ) );
    //                     reject( err );
    //                 }
    //             }
    //         } );
    //     } );
    // }

    initialize() {
        const xform = this;
    
        return new Promise((resolve, reject) => {
            // Read the XML file from GCS
            
            const file = bucket.file(`affiliation/${xform.id}.xml`);
            
            file.download((err, contents) => {
                if (err) {
                    reject(err);
                } else {
                    xform.data = contents.toString('utf-8');
                    try {
                        xform.doc = libxmljs.parseXml(xform.data);
                        xform.namespaces = xform._getNamespaces();
                        resolve(true);
                    } catch (e) {
                        const err = new Error(`XML Error in form "${xform.id}": ${JSON.stringify(e)}`);
                        reject(err);
                    }
                }
            });
        });
    }

    getProperties( baseUrl, verbose ) {
        const xform = this;

        return this.initialize()
            .then( () => {
                const props = {
                    formID: xform._getFormId(),
                    name: xform._getName(),
                    majorMinorVersion: xform._getMajorMinorVersion(),
                    version: xform._getVersion(),
                    hash: xform._getHash(),
                    downloadUrl: xform._getDownloadUrl( baseUrl )
                };

                if ( verbose ) {
                    props.descriptionText = xform._getDescriptionText();
                    props.descriptionUrl = xform._getDescriptionUrl();
                }

                return xform._getManifestUrl( baseUrl )
                    .then( function( manifestUrl ) {
                        if ( manifestUrl ) {
                            props.manifestUrl = manifestUrl;
                        }
                        return props;
                    } );
            } );
    }

    _getNamespaces() {
        // TODO: extract these from this.doc instead
        return {
            xmlns: 'http://www.w3.org/2002/xforms',
            h: 'http://www.w3.org/1999/xhtml',
            jr: 'http://openrosa.org/javarosa',
            orx: 'http://openrosa.org/xforms',
            xsd: 'http://www.w3.org/2001/XMLSchema',
            ev: 'http://www.w3.org/2001/xml-events'
        };
    }

    _getFormId() {
        // let id = this.doc.get( '//xmlns:model/xmlns:instance/node()[@id]', this.namespaces );
        // if ( !id ) {
        //     throw new Error( 'id attribute not found for form "' + this.id + '"' );
        // }
        
        // // there has to be a better way to get this id and version...
        // id = id.attr( 'id' ).toString();
        // console.log("Reading form Id", id);
        // return id.substring( 5, id.length - 1 );
        return this.id;
    }

    _getName() {
        const title = this.doc.get( '//h:head/h:title', this.namespaces );

        if ( !title ) {
            throw new Error( 'title element not found for form "' + this.id + '"' );
        }
        return title.text();
    }

    _getMajorMinorVersion() { return ''; }

    _getVersion() {
        let version = this.doc.get( '//xmlns:model/xmlns:instance/node()[@version]', this.namespaces );
        if ( !version ) {
            return '';
        }
        // there has to be a better way to get this version...
        version= version.getAttribute("version")?.value();
        // version = version.attr("version").toString();
        return version;
    }

    _getHash() { return 'md5:' + utils.md5( this.data ); }

    _getDescriptionText() { return this._getName(); }

    _getDescriptionUrl() { return ''; }

    // _getDownloadUrl( baseUrl ) { return url.resolve( baseUrl, path.join( 'form', this.id, 'form.xml' ) ) }
    _getDownloadUrl(baseUrl) {
        // Construct the GCS URL for the XML file
        const gcsUrl = url.resolve(`https://storage.googleapis.com/`, `/${GCS_BUCKET_NAME}/affiliation/${this.id}.xml`);
        return gcsUrl;
    }

    // _getManifestUrl( baseUrl ) {
    //     const xform = this;

    //     return new Promise( ( resolve, reject ) => {
    //         fs.readdir( path.join( FORMSTORAGEPATH, xform.id + '-media' ), ( error, files ) => {
    //             if ( error || files.length === 0 ) {
    //                 resolve( null );
    //             } else {
    //                 resolve( url.resolve( baseUrl, path.join( '/form/', xform.id, '/manifest.xml' ) ) );
    //             }
    //         } );
    //     } );
    // }

    _getManifestUrl(baseUrl) {
        const xform = this;

        return new Promise((resolve, reject) => {
            // Use GCS API to list objects in the bucket
            bucket.getFiles({ prefix: `affiliation/${xform.id}-media/` }, (err, files) => {
                if (err || files.length === 0) {
                    resolve(null);
                } else {
                    const manifestUrl = url.resolve(baseUrl, path.join('/form/', xform.id, '/manifest.xml'));
                    resolve(manifestUrl);
                }
            });
        });
    }
}

module.exports = Xform;