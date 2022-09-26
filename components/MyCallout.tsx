import * as React from 'react'
import * as types from 'notion-types'
import CryptoJS from 'crypto-js'
import { Text } from 'react-notion-x'
// import { PageIcon } from 'react-notion-x'

import styles from './styles.module.css'


// My callout that supports PasswordInput to decode !


// export interface CalloutBlock extends BaseBlock {
//   type: 'callout';
//   format: {
//       page_icon: string;
//       block_color: Color;
//   };
//   properties: {
//       title: Decoration[];
//   };
// }

export const MyCallout: React.FC<{
  block: types.Block;
  blockId: string;
}> = ({
  block,
  blockId,
}) => {
  const content = block.properties?.title[0][0];
  const isSecret = content.indexOf("Secret:") !== -1; // todo judge by icon, cooler

  return (
    <div
      className={cs(
          'notion-callout',
          block.format?.block_color &&
          `notion-${block.format?.block_color}_co`,
          blockId
      )}
    >
      {/* <PageIcon block={block} /> //todo add */}
      {isSecret ? <DecryptInput secret={block.properties?.title[0][0]} block={block} />
        : // not code
        <div className='notion-callout-text'>
          <Text value={block.properties?.title} block={block} />
          {/* {children} */}
          {/* children not supported 
              because the author FUCKING forgot to pass this prop */}
        </div>
      }
    </div>
  )
}


const DecryptInput: React.FC<{
  secret: string;
  block: types.Block;
}> = ({ secret, block }) => {
  
  secret = secret.replace("Secret:", "").replace("\n", "");

  const [plain, setPlain] = React.useState('')
  const [key, setKey] = React.useState('')
  const [text, setText] = React.useState('')

  let isEncrypt = false;
  if(secret=='Encrypt'){
    isEncrypt = true;
  }

  const decrypt = (secret, key) => {
    try{
      setText(
        CryptoJS.AES.decrypt(secret, key, {
          format: JsonFormatter
        }).toString(CryptoJS.enc.Utf8)
      )
    } catch (error) {
      setText('')
    } // avoid Malformed Utf8
  }

  const encrypt = (plain, key) => {
    try{
      const plainBits = CryptoJS.enc.Utf8.parse(plain);
      setText(
        CryptoJS.AES.encrypt(plainBits, key, {
          format: JsonFormatter
        }).toString()
      )
    } catch (error) {
      setText('')
    } // avoid Malformed Utf8
  }

  return (
    <div className={cs('notion-callout-text', styles['notion-secret'])}>
      {
        isEncrypt ? // encrypt
        <div>
          <input type='text' placeholder="Enter plain here..." 
            onChange={ (e) => {
              setPlain(e.target.value);
              encrypt(e.target.value, key);
            }}
          />
          <input type='text' placeholder="Enter key here..." 
            onChange={ (e) => {
              setKey(e.target.value);
              encrypt(plain, e.target.value);
            }}
          />
        </div>
        :         // decrypt
        <input type='text' placeholder="Enter key here..." 
          onChange={ (e) => { decrypt(secret, e.target.value) }}
        />
      }
      <b><Text value={[[text]]} block={block} /></b>
    </div>
  )
}

const JsonFormatter = {
  stringify: function(cipherParams: any) {
    // create json object with ciphertext
    const jsonObj: any = { ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64) };
    // optionally add iv or salt
    if (cipherParams.iv) {
      jsonObj.iv = cipherParams.iv.toString();
    }
    if (cipherParams.salt) {
      jsonObj.s = cipherParams.salt.toString();
    }
    // stringify json object
    const jsonStr = JSON.stringify(jsonObj);
    // to base64 string
    const jsonStrUtf8 = CryptoJS.enc.Utf8.parse(jsonStr);
    const jsonStr64 = CryptoJS.enc.Base64.stringify(jsonStrUtf8);
    return jsonStr64;
  },
  parse: function(jsonStr64) {
    const jsonStr = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(jsonStr64));
    // parse json string
    const jsonObj = JSON.parse(jsonStr);
    // extract ciphertext from json object, and create cipher params object
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
    });
    // optionally extract iv or salt
    if (jsonObj.iv) {
      cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
    }
    if (jsonObj.s) {
      cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
    }
    return cipherParams;
  }
};

const cs = (...classes: Array<string | undefined | false>) =>
  classes.filter((a) => !!a).join(' ')
