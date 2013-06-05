
/* OpenPGP public key extraction
 * Copyright 2005 Herbert Hanewinkel, www.haneWIN.de
 * version 1.1, check www.haneWIN.de for the latest version
 * Modified by Philipp Hagemeister<hagemeister@cs.uni-duesseldorf.de> for inclusion in keysheet

 * This software is provided as-is, without express or implied warranty.  
 * Permission to use, copy, modify, distribute or sell this software, with or
 * without fee, for any purpose and by any individual or organization, is hereby
 * granted, provided that the above copyright notice and this paragraph appear 
 * in all copies. Distribution as a part of an application or binary must
 * include the above copyright notice in the documentation and/or other materials
 * provided with the application or distribution.
 */

function s2hex(s)
{
  var result = '';
  for(var i=0; i<s.length; i++)
  {
    c = s.charCodeAt(i);
    result += ((c<16) ? "0" : "") + c.toString(16);
  }
  return result;
}

function getPublicKey(text)
{
  var res = {};
  var i= text.indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----');
  if(i == -1)
  {
    return false;
  }
 
  var a=text.indexOf('\n\n',i);
  if(a>0) a += 2;
  else
  {
    a = text.indexOf('\n\r\n', i);
    if(a>0) a += 3;
  }

  var e=text.indexOf('\n=',i); 
  if(a>0 && e>0) text = text.slice(a,e); 
  else
  {
    return false;
  }
 
  var s=r2s(text);

  for(var i=0; i < s.length;)
  {
    var tag = s.charCodeAt(i++);

    if((tag&128) == 0) break;

    if(tag&64)
    {
      tag&=63;
      len=s.charCodeAt(i++);
      if(len >191 && len <224) len=((len-192)<<8) + s.charCodeAt(i++);
      else if(len==255) len = (s.charCodeAt(i++)<<24) + (s.charCodeAt(i++)<<16) + (s.charCodeAt(i++)<<8) + s.charCodeAt(i++);
      else if(len>223 &&len<255) len = (1<<(len&0x1f)); 
    }
    else
    {
      len = tag&3;
      tag = (tag>>2)&15;
      if(len==0) len = s.charCodeAt(i++);
      else if(len==1) len = (s.charCodeAt(i++)<<8) + s.charCodeAt(i++);
      else if(len==2) len = (s.charCodeAt(i++)<<24) + (s.charCodeAt(i++)<<16) + (s.charCodeAt(i++)<<8) + s.charCodeAt(i++);
      else len = s.length-1;
    }

    if(tag==6)  //  public key
    {
      var k = i;
      var vers=s.charCodeAt(i++);

      res.vers=vers;

      var time=(s.charCodeAt(i++)<<24) + (s.charCodeAt(i++)<<16) + (s.charCodeAt(i++)<<8) + s.charCodeAt(i++);
      
      if(vers==2 || vers==3) var valid=s.charCodeAt(i++)<<8 + s.charCodeAt(i++);

      var algo=s.charCodeAt(i++);

      if(algo == 1 || algo == 2)
      {
        var m = i;
        var lm = Math.floor((s.charCodeAt(i)*256 + s.charCodeAt(i+1)+7)/8);
        i+=lm+2;

        var mod = s.substr(m,lm+2);
        var le = Math.floor((s.charCodeAt(i)*256 + s.charCodeAt(i+1)+7)/8);
        i+=le+2;

        res.pkey=s2r(s.substr(m,lm+le+4));
        res.type="RSA";

        if(vers==3)
        {
           res.keyid=s2hex(mod.substr(mod.length-8, 8));
        }
        else if(vers==4)
        {
          var pkt = String.fromCharCode(0x99) + String.fromCharCode(len>>8) 
                    + String.fromCharCode(len&255)+s.substr(k, len);
          var fp = str_sha1(pkt);
          res.fp=s2hex(fp);
          res.keyid=s2hex(fp.substr(fp.length-8,8));
        }
        else
        {
          res.keyid='';
        }
      }
      else if((algo == 16 || algo == 20) && vers == 4)
      {
        var m = i;

        var lp = Math.floor((s.charCodeAt(i)*256 + s.charCodeAt(i+1)+7)/8);
        i+=lp+2;

        var lg = Math.floor((s.charCodeAt(i)*256 + s.charCodeAt(i+1)+7)/8);
        i+=lg+2;

        var ly = Math.floor((s.charCodeAt(i)*256 + s.charCodeAt(i+1)+7)/8);
        i+=ly+2;

        res.pkey=s2r(s.substr(m,lp+lg+ly+6));

        var pkt = String.fromCharCode(0x99) + String.fromCharCode(len>>8) 
                    + String.fromCharCode(len&255)+s.substr(k, len);
        var fp = str_sha1(pkt);
        res.fp_enc=s2hex(fp);
        res.keyid=s2hex(fp.substr(fp.length-8,8));
        res.type="ELGAMAL";
      }
      else if (algo == 17 && vers == 4) { // DSA
        var pkt = String.fromCharCode(0x99) + String.fromCharCode(len>>8)
                    + String.fromCharCode(len&255)+s.substr(k, len);
        var fp = str_sha1(pkt);
        res.fp=s2hex(fp);
        i = k + len;
      } else
      {
        i = k + len;
      }
    }
    else if(tag==13)   // user id
    {
      if (!res.user) {
        res.user=s.substr(i,len);
      }

      i+=len;
    }
    else
    {
      i+=len;
    }
  }
  return res;
}
