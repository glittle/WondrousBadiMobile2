var _localeMessages = {};
var ObjectConstant = '$****$';
var splitSeparator = /[,?]+/;
var _cachedMessages = {};
var _cachedMessageUseCount = 0;

var settings = {
  useArNames: false,
  rememberFocusTimeMinutes: 5, // show on settings page?
  optedOutOfGoogleAnalytics: getStorage('optOutGa', -1),
  //  integrateIntoGoogleCalendar: getStorage('enableGCal', true),
  iconTextColor: getStorage('iconTextColor', 'black')
};

var _nextFilledWithEach_UsesExactMatchOnly = false;
var _languageCode = '';
var _languageDir = '';

var holyDays = HolyDays();
var knownDateInfos = {};
var _di = {};
var _initialDiStamp;
var _focusTime;
var _locationLat = 0;
var _locationLong = 0;

var lists = {};

settings.useArNames = getStorage('useArNames', false);

var use24HourClock = false;


function onLocaleLoaded() {
  _languageCode = getMessage('translation');
  _languageDir = ',fa'.search(_languageCode) !== -1 ? 'rtl' : 'ltr';
  use24HourClock = getMessage('use24HourClock') === 'true';

  lists.bMonthNameAr = getMessage("bMonthNameAr").split(splitSeparator);
  lists.bMonthMeaning = getMessage("bMonthMeaning").split(splitSeparator);

  lists.bWeekdayNameAr = getMessage("bWeekdayNameAr").split(splitSeparator); // from Saturday
  lists.bWeekdayMeaning = getMessage("bWeekdayMeaning").split(splitSeparator);

  lists.bYearInVahidNameAr = getMessage("bYearInVahidNameAr").split(splitSeparator);
  lists.bYearInVahidMeaning = getMessage("bYearInVahidMeaning").split(splitSeparator);

  setupLanguageChoice();

  lists.gWeekdayLong = getMessage("gWeekdayLong").split(splitSeparator);
  lists.gWeekdayShort = getMessage("gWeekdayShort").split(splitSeparator);
  lists.gMonthLong = getMessage("gMonthLong").split(splitSeparator);
  lists.gMonthShort = getMessage("gMonthShort").split(splitSeparator);

  lists.ordinal = getMessage('ordinal').split(splitSeparator);
  lists.ordinalNames = getMessage('ordinalNames').split(splitSeparator);
  lists.elements = getMessage('elements').split(splitSeparator);

  refreshDateInfo();

  if (_onReadyFn) {
    _onReadyFn();
  }
}

function setupLanguageChoice() {
  lists.bMonthNamePri = settings.useArNames ? lists.bMonthNameAr : lists.bMonthMeaning;
  lists.bMonthNameSec = !settings.useArNames ? lists.bMonthNameAr : lists.bMonthMeaning;
  lists.bWeekdayNamePri = settings.useArNames ? lists.bWeekdayNameAr : lists.bWeekdayMeaning;
  lists.bWeekdayNameSec = !settings.useArNames ? lists.bWeekdayNameAr : lists.bWeekdayMeaning;
  lists.bYearInVahidNamePri = settings.useArNames ? lists.bYearInVahidNameAr : lists.bYearInVahidMeaning;
  lists.bYearInVahidNameSec = !settings.useArNames ? lists.bYearInVahidNameAr : lists.bYearInVahidMeaning;
}

function refreshDateInfo() {
  return _di = getDateInfo(getFocusTime());
}

function getDateInfo(currentTime, onlyStamp) {
  // hard code limits
  var minDate = new Date(1844, 2, 21, 0, 0, 0, 0);
  if (currentTime < minDate) {
    currentTime = minDate;
  } else {
    var maxDate = new Date(2844, 2, 20, 0, 0, 0, 0);
    if (currentTime > maxDate) {
      currentTime = maxDate;
    }
  }

  var known = knownDateInfos[currentTime];
  if (known) {
    return known;
  }

  var bNow = holyDays.getBDate(currentTime);
  if (onlyStamp) {
    return {
      stamp: JSON.stringify(bNow),
      stampDay: '{y}.{m}.{d}'.filledWith(bNow)
    };
  }

  // split the Baha'i day to be "Eve" - sunset to midnight; 
  // and "Morn" - from midnight through to sunset
  var frag1Noon = new Date(currentTime.getTime());
  frag1Noon.setHours(12, 0, 0, 0);
  if (!bNow.eve) {
    // if not already frag1, make it so
    frag1Noon.setDate(frag1Noon.getDate() - 1);
  }
  var frag2Noon = new Date(frag1Noon.getTime());
  frag2Noon.setDate(frag2Noon.getDate() + 1);

  var frag1SunTimes = sunCalc.getTimes(frag1Noon, _locationLat, _locationLong);
  var frag2SunTimes = sunCalc.getTimes(frag2Noon, _locationLat, _locationLong);

  var di = { // date info
    frag1: frag1Noon,
    frag1Year: frag1Noon.getFullYear(),
    frag1Month: frag1Noon.getMonth(),
    frag1Day: frag1Noon.getDate(),
    frag1Weekday: frag1Noon.getDay(),

    frag2: frag2Noon,
    frag2Year: frag2Noon.getFullYear(),
    frag2Month: frag2Noon.getMonth(), // 0 based
    frag2Day: frag2Noon.getDate(),
    frag2Weekday: frag2Noon.getDay(),

    currentYear: currentTime.getFullYear(),
    currentMonth: currentTime.getMonth(), // 0 based
    currentMonth1: 1 + currentTime.getMonth(),
    currentDay: currentTime.getDate(),
    currentDay00: digitPad2(currentTime.getDate()),
    currentWeekday: currentTime.getDay(),
    currentTime: currentTime,

    startingSunsetDesc12: showTime(frag1SunTimes.sunset),
    startingSunsetDesc24: showTime(frag1SunTimes.sunset, 24),
    endingSunsetDesc12: showTime(frag2SunTimes.sunset),
    endingSunsetDesc24: showTime(frag2SunTimes.sunset, 24),
    frag1SunTimes: frag1SunTimes,
    frag2SunTimes: frag2SunTimes,

    sunriseDesc12: showTime(frag2SunTimes.sunrise),
    sunriseDesc24: showTime(frag2SunTimes.sunrise, 24),

    bNow: bNow,
    bDay: bNow.d,
    bWeekday: 1 + (frag2Noon.getDay() + 1) % 7,
    bMonth: bNow.m,
    bYear: bNow.y,
    bVahid: Math.floor(1 + (bNow.y - 1) / 19),
    bDateCode: bNow.m + '.' + bNow.d,

    bDayNameAr: lists.bMonthNameAr[bNow.d],
    bDayMeaning: lists.bMonthMeaning[bNow.d],
    bMonthNameAr: lists.bMonthNameAr[bNow.m],
    bMonthMeaning: lists.bMonthMeaning[bNow.m],

    bEraLong: getMessage('eraLong'),
    bEraAbbrev: getMessage('eraAbbrev'),
    bEraShort: getMessage('eraShort'),

    stamp: JSON.stringify(bNow) // used to compare to other dates and for developer reference 
  };

  di.bDayNamePri = settings.useArNames ? di.bDayNameAr : di.bDayMeaning;
  di.bDayNameSec = !settings.useArNames ? di.bDayNameAr : di.bDayMeaning;
  di.bMonthNamePri = settings.useArNames ? di.bMonthNameAr : di.bMonthMeaning;
  di.bMonthNameSec = !settings.useArNames ? di.bMonthNameAr : di.bMonthMeaning;

  di.VahidLabelPri = settings.useArNames ? getMessage('Vahid') : getMessage('VahidLocal');
  di.VahidLabelSec = !settings.useArNames ? getMessage('Vahid') : getMessage('VahidLocal');

  di.KullishayLabelPri = settings.useArNames ? getMessage('Kullishay') : getMessage('KullishayLocal');
  di.KullishayLabelSec = !settings.useArNames ? getMessage('Kullishay') : getMessage('KullishayLocal');

  di.bKullishay = Math.floor(1 + (di.bVahid - 1) / 19);
  di.bVahid = di.bVahid - (di.bKullishay - 1) * 19;
  di.bYearInVahid = di.bYear - (di.bVahid - 1) * 19 - (di.bKullishay - 1) * 19 * 19;

  di.bYearInVahidNameAr = lists.bYearInVahidNameAr[di.bYearInVahid];
  di.bYearInVahidMeaning = lists.bYearInVahidMeaning[di.bYearInVahid];
  di.bYearInVahidNamePri = settings.useArNames ? di.bYearInVahidNameAr : di.bYearInVahidMeaning;
  di.bYearInVahidNameSec = !settings.useArNames ? di.bYearInVahidNameAr : di.bYearInVahidMeaning;

  di.bWeekdayNameAr = lists.bWeekdayNameAr[di.bWeekday];
  di.bWeekdayMeaning = lists.bWeekdayMeaning[di.bWeekday];
  di.bWeekdayNamePri = settings.useArNames ? di.bWeekdayNameAr : di.bWeekdayMeaning;
  di.bWeekdayNameSec = !settings.useArNames ? di.bWeekdayNameAr : di.bWeekdayMeaning;

  di.elementNum = getElementNum(bNow.m);
  di.element = lists.elements[di.elementNum - 1];

  di.bDayOrdinal = di.bDay + getOrdinal(di.bDay);
  di.bVahidOrdinal = di.bVahid + getOrdinal(di.bVahid);
  di.bKullishayOrdinal = di.bKullishay + getOrdinal(di.bKullishay);
  di.bDayOrdinalName = getOrdinalName(di.bDay);
  di.bVahidOrdinalName = getOrdinalName(di.bVahid);
  di.bKullishayOrdinalName = getOrdinalName(di.bKullishay);

  di.bDay00 = digitPad2(di.bDay);
  di.frag1Day00 = digitPad2(di.frag1Day);
  di.currentMonth01 = digitPad2(di.currentMonth1);
  di.frag2Day00 = digitPad2(di.frag2Day);
  di.frag1Month00 = digitPad2(1 + di.frag1Month); // change from 0 based
  di.frag2Month00 = digitPad2(1 + di.frag2Month); // change from 0 based
  di.bMonth00 = digitPad2(di.bMonth);
  di.bYearInVahid00 = digitPad2(di.bYearInVahid);
  di.bVahid00 = digitPad2(di.bVahid);

  di.startingSunsetDesc = use24HourClock ? di.startingSunsetDesc24 : di.startingSunsetDesc12;
  di.endingSunsetDesc = use24HourClock ? di.endingSunsetDesc24 : di.endingSunsetDesc12;
  di.sunriseDesc = use24HourClock ? di.sunriseDesc24 : di.sunriseDesc12;

  di.frag1MonthLong = lists.gMonthLong[di.frag1Month];
  di.frag1MonthShort = lists.gMonthShort[di.frag1Month];
  di.frag1WeekdayLong = lists.gWeekdayLong[di.frag1Weekday];
  di.frag1WeekdayShort = lists.gWeekdayShort[di.frag1Weekday];

  di.frag2MonthLong = lists.gMonthLong[di.frag2Month];
  di.frag2MonthShort = lists.gMonthShort[di.frag2Month];
  di.frag2WeekdayLong = lists.gWeekdayLong[di.frag2Weekday];
  di.frag2WeekdayShort = lists.gWeekdayShort[di.frag2Weekday];

  di.currentMonthLong = lists.gMonthLong[di.currentMonth];
  di.currentMonthShort = lists.gMonthShort[di.currentMonth];
  di.currentWeekdayLong = lists.gWeekdayLong[di.currentWeekday];
  di.currentWeekdayShort = lists.gWeekdayShort[di.currentWeekday];
  di.currentDateString = moment(di.currentTime).format('YYYY-MM-DD');


  di.currentRelationToSunset = getMessage(bNow.eve ? 'afterSunset' : 'beforeSunset');
  var thisMoment = new Date().getTime();
  di.dayStarted = getMessage(thisMoment > di.frag1SunTimes.sunset.getTime() ? 'dayStartedPast' : 'dayStartedFuture');
  di.dayEnded = getMessage(thisMoment > di.frag2SunTimes.sunset.getTime() ? 'dayEndedPast' : 'dayEndedFuture');
  di.dayStartedLower = di.dayStarted.toLocaleLowerCase();
  di.dayEndedLower = di.dayEnded.toLocaleLowerCase();

  // di.bMonthDayYear = getMessage('gMonthDayYear', di);

  if (di.frag1Year !== di.frag2Year) {
    // Dec 31/Jan 1
    // Dec 31, 2015/Jan 1, 2015
    di.gCombined = getMessage('gCombined_3', di);
    di.gCombinedY = getMessage('gCombinedY_3', di);
  } else if (di.frag1Month !== di.frag2Month) {
    // Mar 31/Apr 1
    // Mar 31/Apr 1, 2015
    di.gCombined = getMessage('gCombined_2', di);
    di.gCombinedY = getMessage('gCombinedY_2', di);
  } else {
    // Jul 12/13
    // Jul 12/13, 2015
    di.gCombined = getMessage('gCombined_1', di);
    di.gCombinedY = getMessage('gCombinedY_1', di);
  }
  di.nearestSunset = getMessage(bNow.eve ? "nearestSunsetEve" : "nearestSunsetDay", di);

  di.stampDay = '{y}.{m}.{d}'.filledWith(di.bNow); // ignore eve/day

  //if (!skipUpcoming) {
  //  getUpcoming(di);
  //}

  knownDateInfos[currentTime] = di;

  return di;
}

function getElementNum(num) {
  // the Bab's designations, found in 'https://books.google.ca/books?id=XTfoaK15t64C&pg=PA394&lpg=PA394&dq=get+of+the+heart+nader+bab&source=bl&ots=vyF-pWLAr8&sig=ruiuoE48sGWWgaB_AFKcSfkHvqw&hl=en&sa=X&ei=hbp0VfGwIon6oQSTk4Mg&ved=0CDAQ6AEwAw#v=snippet&q=%22air%20of%20eternity%22&f=false'

  //  1, 2, 3
  //  4, 5, 6, 7
  //  8, 9,10,11,12,13
  // 14,15,16,17,18,19
  var element = 1;
  if (num >= 4 && num <= 7) {
    element = 2;
  } else if (num >= 8 && num <= 13) {
    element = 3;
  } else if (num >= 14 && num <= 19) {
    element = 4;
  } else if (num === 0) {
    element = 0;
  }
  return element;
}


function getFocusTime() {
  if (!_focusTime) {
    return new Date();
  }

  if (isNaN(_focusTime)) {
    log('unexpected 1: ', _focusTime);
    return new Date();
  }

  return _focusTime;
}

function setFocusTime(t) {
  _focusTime = t || (t = new Date());
  if (isNaN(_focusTime)) {
    log('unexpected 2: ', _focusTime);
  }
}

function log() {
  // add a timestamp to console log entries
  //  var a = ['%c'];
  //  a.push('display: block; text-align: right;');
  //  a.push(new moment().format('DD H:mm:ss'));
  //  a.push('\n');
  var a = ['\n'];
  for (var x in log.arguments) {
    if (log.arguments.hasOwnProperty(x)) {
      a.push(log.arguments[x]);
    }
  }
  console.log.apply(console, a);

  // var div = $('#log');
  // if (div) {
  //   div.append(`<div>${a.join('')}</div>`);
  // }

}










function setStorage(key, value) {
  /// <summary>Save this value in the browser's local storage. Dates do NOT get returned as full dates!</summary>
  /// <param name="key" type="string">The key to use</param>
  /// <param name="value" type="string">The value to store. Can be a simple or complex object.</param>
  if (value === null) {
    window.localStorage.removeItem(key);
    return null;
  }
  if (typeof value === 'object' || typeof value === 'boolean') {
    var strObj = JSON.stringify(value);
    value = ObjectConstant + strObj;
  }

  window.localStorage[key] = value + "";

  return value;
}


function getStorage(key, defaultValue) {
  /// <summary>Get a value from storage.</summary>
  var checkForObject = function (obj) {
    if (obj.substring(0, ObjectConstant.length) === ObjectConstant) {
      obj = $.parseJSON(obj.substring(ObjectConstant.length));
    }
    return obj;
  };

  var value = window.localStorage[key];
  if (typeof value !== 'undefined' && value != null) {
    return checkForObject(value);
  }
  return defaultValue;
}

String.prototype.filledWith = function () {
  /// <summary>Similar to C# String.Format...  in two modes:
  /// 1) Replaces {0},{1},{2}... in the string with values from the list of arguments. 
  /// 2) If the first and only parameter is an object, replaces {xyz}... (only names allowed) in the string with the properties of that object. 
  /// Notes: the { } symbols cannot be escaped and should only be used for replacement target tokens;  only a single pass is done. 
  /// </summary>

  var values = typeof arguments[0] === 'object' && arguments.length === 1 ? arguments[0] : arguments;

  //  var testForFunc = /^#/; // simple test for "#"
  var testForElementAttribute = /^\*/; // simple test for "#"
  var testDoNotEscapeHtml = /^\^/; // simple test for "^"
  var testDoNotEscpaeHtmlButToken = /^-/; // simple test for "-"
  var testDoNotEscpaeHtmlButSinglQuote = /^\>/; // simple test for ">"

  var extractTokens = /{([^{]+?)}/g;

  var replaceTokens = function (input) {
    return input.replace(extractTokens, function () {
      var token = arguments[1];
      var value;
      //try {
      if (token[0] === ' ') {
        // if first character is a space, do not process
        value = '{' + token + '}';
      } else if (values === null) {
        value = '';
      }
      //else if (testForFunc.test(token)) {
      //  try {
      //    debugger;
      //    log('eval... ' + token);
      //    value = eval(token.substring(1));
      //  }
      //  catch (e) {
      //    // if the token cannot be executed, then pass it through intact
      //    value = '{' + token + '}';
      //  }
      //}
      else if (testForElementAttribute.test(token)) {
        value = quoteattr(values[token.substring(1)]);
      } else if (testDoNotEscpaeHtmlButToken.test(token)) {
        value = values[token.substring(1)].replace(/{/g, '&#123;');
      } else if (testDoNotEscpaeHtmlButSinglQuote.test(token)) {
        value = values[token.substring(1)].replace(/'/g, "%27");
      } else if (testDoNotEscapeHtml.test(token)) {
        value = values[token.substring(1)];
      } else {
        if (values.hasOwnProperty(token)) {
          var toEscape = values[token];
          //value = typeof toEscape == 'undefined' || toEscape === null ? '' : ('' + toEscape).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/{/g, '&#123;');
          //Never escape HTML in this Chrome Extension
          value = toEscape === 0 ? 0 : (toEscape || '');
        } else {
          if (_nextFilledWithEach_UsesExactMatchOnly) {
            value = '{' + token + '}';
          } else {
            log('missing property for filledWith: ' + token);
            //debugger;
            value = '';
          }
        }
      }


      //REMOVE try... catch to optimize in this project... not dealing with unknown and untested input

      //          } catch (err) {
      //            log('filledWithError:\n' +
      //                err +
      //                '\ntoken:' +
      //                token +
      //                '\nvalue:' +
      //                value +
      //                '\ntemplate:' +
      //                input +
      //                '\nall values:\n');
      //            log(values);
      //            throw 'Error in Filled With';
      //          }
      return (typeof value == 'undefined' || value == null ? '' : ('' + value));
    });
  };

  var result = replaceTokens(this);

  var lastResult = '';
  while (lastResult !== result) {
    lastResult = result;
    result = replaceTokens(result);
  }

  return result;
};

function quoteattr(s, preserveCr) {
  preserveCr = preserveCr ? '&#13;' : '\n';
  return ('' + s) /* Forces the conversion to string. */
    .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
    .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    /*
    You may add other replacements here for HTML only 
    (but it's not necessary).
    Or for XML, only if the named entities are defined in its DTD.
    */
    .replace(/\r\n/g, preserveCr) /* Must be before the next replacement. */
    .replace(/[\r\n]/g, preserveCr);
}


String.prototype.filledWithEach = function (arr) {
  /// <summary>Silimar to 'filledWith', but repeats the fill for each item in the array. Returns a single string with the results.
  /// </summary>
  if (arr === undefined || arr === null) {
    return '';
  }
  var result = [];
  for (var i = 0, max = arr.length; i < max; i++) {
    result[result.length] = this.filledWith(arr[i]);
  }
  _nextFilledWithEach_UsesExactMatchOnly = false;
  return result.join('');
};

function getMessage(key, obj, defaultValue) {
  var rawMsg = _cachedMessages[key];
  if (!rawMsg) {
    //rawMsg = chrome.i18n.getMessage(key);
    rawMsg = getRawMessage(key);
    _cachedMessages[key] = rawMsg;
  } else {
    // _cachedMessageUseCount++; --> good for testing
    //    console.log(_cachedMessageUseCount + ' ' + key);
  }

  var msg = rawMsg || defaultValue || '{' + key + '}';
  if (obj === null || typeof obj === 'undefined' || msg.search(/{/) === -1) {
    return msg;
  }

  var before = msg;
  var repeats = 0;
  while (repeats < 5) { // failsafe
    msg = msg.filledWith(obj);
    if (msg === before) {
      return msg;
    }
    if (msg.search(/{/) === -1) {
      return msg;
    }
    before = msg;
    repeats++;
  }
  return msg;

}

function digitPad2(num) {
  return ('00' + num).slice(-2);
}

function getOrdinal(num) {
  return lists.ordinal[num] || lists.ordinal[0] || num;
}

function getOrdinalName(num) {
  return lists.ordinalNames[num] || num;
}


function determineDaysAway(di, moment1, moment2, sameDay) {
  var days = moment2.diff(moment1, 'days');
  if (days === 1 && !di.bNow.eve) {
    return getMessage('Tonight');
  }
  if (days === -1) {
    return getMessage('Ended');
  }
  if (days === 0) {
    return getMessage('Now');
  }
  return getMessage(days === 1 ? '1day' : 'otherDays').filledWith(days);
}


function showTime(d, use24) {
  var hoursType = use24HourClock || (use24 === 24) ? 24 : 0;
  var show24Hour = hoursType === 24;
  var hours24 = d.getHours();
  var pm = hours24 >= 12;
  var hours = show24Hour
    ? hours24
    : hours24 > 12
      ? hours24 - 12
      : hours24 === 0
        ? 12
        : hours24;
  var minutes = d.getMinutes();
  var time = hours + ':' + ('0' + minutes).slice(-2);
  if (!show24Hour) {
    if (hours24 === 12 && minutes === 0) {
      time = getMessage('noon');
    } else if (hours24 === 0 && minutes === 0) {
      time = getMessage('midnight');
    } else {
      time = getMessage('timeFormat12')
        .filledWith({
          time: time,
          ampm: pm ? getMessage('pm') : getMessage('am')
        });
    }
  }
  return time;
};


var findName = function (typeName, results, getLastMatch) {
  var match = null;
  for (var r = 0; r < results.length; r++) {
    var result = results[r];
    if (result.types.indexOf(typeName) !== -1) {
      match = result.formatted_address;
      if (!getLastMatch) return match;
    }
  }
  return match;
};


function getRawMessage(key) {
  var raw = _localeMessages[key];
  if (raw) {
    return raw.message || '';
  }
  return '';
}

function loadLocaleInfo() {
  // read English, then overwrite with current locale
  readFile('en').done(function (data) {
    _localeMessages = data;
  }).fail(function(x,y){
    console.log(x,y)
  }).then(function () {
    // determine locale...
    // if not EN, then load the 2nd file
  }).then(onLocaleLoaded);
}

function readFile(locale, fn) {
  return $.getJSON(`./locales/${locale}/messages.json`);
}

var _onReadyFn;

function sharedStartup(fnLocationReady, fnReady) {
  _onReadyFn = fnReady;

  //TODO chain as a promise
  navigator.geolocation.getCurrentPosition(function (position) {
    _locationLat = position.coords.latitude;
    _locationLong = position.coords.longitude;

    fnLocationReady();

    loadLocaleInfo();
  }, function (err) {
    console.log(err);
    }, {
      enableHighAccuracy: false,
      maximumAge: 1000 * 60 * 2 // 2 hours
    });

}
