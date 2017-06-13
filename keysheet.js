'use strict';

function genQRField(qrImg) {
	if (!qrImg) return false;
	var res = $('<img class="qr" />');
	res.attr('src', qrImg);
	return res;
}

function genQRImg(text) {
	var qr = new QRCode(4, QRErrorCorrectLevel.L);
	qr.addData(text);
	qr.make();
	var qrsize = qr.getModuleCount();

	var FACTOR = 8;
	var PADDING = 1;
	var canvas = document.createElement('canvas');
	var realSize = (qrsize+2*PADDING) * FACTOR;
	canvas.setAttribute('width', realSize);
	canvas.setAttribute('height', realSize);
	var ctx = canvas.getContext('2d');
	if (!ctx) return false;
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, realSize, realSize);

	ctx.fillStyle = '#000';
	for (var x = 0;x < qrsize;x++) {
		for (var y = 0;y < qrsize;y++) {
			if (qr.isDark(y, x)) {
				ctx.fillRect(
					(PADDING + x) * FACTOR, (PADDING + y) * FACTOR,
					FACTOR, FACTOR);
			}
		}
	}
	var url = canvas.toDataURL('image/png');
	return url;
}

function genNew() {
	removeRender();
	$('#regen').remove();
	$('#keyForm').show();
	$('#id_selector').remove();
	return false;
}

function parseEmail(uid) {
	return uid.split(/ ?</)[1].replace(/>/, '');
}

function parseName(uid) {
	return uid.split(/ ?</)[0];
}

function removeRender() {
	$('.box').remove();
}

var previousKey;
var previousName;
function renderKey(k, name, emails) {
	removeRender();
	if (typeof k == 'undefined') {
		k = previousKey;
	} else {
		previousKey = k;
	}

	if (typeof name == 'undefined') {
		name = previousName;
	} else {
		previousName = name;
	}

	var email_str;
	if (typeof emails == 'undefined') {
		email_str = parseEmail(k.user);
	} else {
		email_str = emails.join('\n');
	}

	var fingerprint = k.fp.toUpperCase().replace(/([^ ]{20})/g, '$1\n').replace(/([0-9A-F]{4})/g, '$1 ').replace(/^\s+|\s+$/g, '');
	var keyId = '0x' + k.fp.substr(24);

	$('#keyForm').hide();
	var qrText = 'http://pgp.mit.edu:11371/pks/lookup?op=get&search=' + keyId;
	var container = $('#container');
	var qrImg = genQRImg(qrText);

	var renderBox = function() {
		var box = $('<div class="box" />');
		
		var userField = $('<div class="user" />');
		userField.text(name);
		box.append(userField);
		
		var emailField = $('<div class="email" />');
		emailField.text(email_str);
		box.append(emailField);

		var fpField = $('<div class="fingerprint" />');
		fpField.text(fingerprint);
		box.append(fpField);

		if (qrImg) {
			var qrField = genQRField(qrImg);
			box.append(qrField);
		}
		return box;
	};

	var firstBox = renderBox();
	container.append(firstBox);
	var boxCount = parseInt(Math.floor(1800 / container.height()));

	for (var i = 1;i < boxCount;i++) {
		container.append(renderBox());
	}
}

function onChange(e) {
	var keyField = $('#key');
	var armored = keyField.val();
	if (typeof(armored) == 'undefined' || armored == '') return;

	var k = getPublicKey(armored);
	if (!k) return;

	var user = parseName(k.user);
	if (user.length > 40) {
		user = user.replace(/\s*\(.*/, '');
	}
	renderKey(k, user);
	keyField.val('');

	if (k.user_ids.length > 1) {
		var id_selector = $('<form id="id_selector" />');
		$.each(k.user_ids, function (idx, uid) {
			var lbl = $('<label>');
			var email = parseEmail(uid);
			lbl.text(email);
			var cb = $('<input type="checkbox">');
			cb.attr('data-email', email);
			if (idx == 0) {
				cb.attr('checked', 'checked');
			}
			lbl.prepend(cb);
			cb.change(onEmailSelectionChange);

			id_selector.append(lbl);
		});
		$('#options').append(id_selector);
	}
	
	var regenLink = $('<a href="#" id="regen">Generate another one</a>');
	regenLink.click(genNew);
	$('body').append(regenLink);

	if (!e) e = window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();
}

function onEmailSelectionChange() {
	var emails = $.map($.makeArray($('#id_selector input:checked')),
		function(n) {
			return n.getAttribute('data-email');
		});
	renderKey(undefined, undefined, emails);
}

$(document).ready(function() {
	var keyField = document.getElementById('key');
	keyField.addEventListener('change', onChange, true);
	keyField.addEventListener('keyup', onChange, true);
	keyField.addEventListener('input', onChange, true);
});
