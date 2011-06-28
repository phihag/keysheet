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
	$('.box').remove();
	$('#regen').remove();
	$('#keyForm').show();
	return false;
}

function onChange(e) {
	var keyField = $('#key');
	var armored = keyField.val();
	if (typeof(armored) == 'undefined' || armored == '') return;
	
	var k = getPublicKey(armored);
	if (!k) return;
	
	var tmp = k.user.split(/ ?</);
	var user = tmp[0];
	var email = tmp[1].replace(/>/, '');
	var fingerprint = k.fp.toUpperCase().replace(/([^ ]{20})/g, '$1\n').replace(/([0-9A-F]{4})/g, '$1 ').replace(/^\s+|\s+$/g, '');
	var keyId = '0x' + k.fp.substr(24);

	keyField.val('');
	$('#keyForm').hide();
	var qrText = 'http://pgp.mit.edu:11371/pks/lookup?op=get&search=' + keyId;
	var container = $('#container');
	var qrImg = genQRImg(qrText);
	for (var i = 0;i < 7;i++) {
		var box = $('<div class="box" />');
		
		var userField = $('<div class="user" />');
		userField.text(user);
		box.append(userField);
		
		var emailField = $('<div class="email" />');
		emailField.text(email);
		box.append(emailField);

		var fpField = $('<div class="fingerprint" />');
		fpField.text(fingerprint);
		box.append(fpField);

		if (qrImg) {
			var qrField = genQRField(qrImg);
			box.append(qrField);
		}

		container.append(box);
	}
	
	var regenLink = $('<a href="#" id="regen">Generate another one</a>');
	regenLink.click(genNew);
	$('body').append(regenLink);

	if (!e) var e = window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();
}

$(document).ready(function() {
	var keyField = document.getElementById('key');
	keyField.addEventListener('change', onChange, true);
	keyField.addEventListener('keyup', onChange, true);
	keyField.addEventListener('input', onChange, true);
});
