import React from 'react';

import windowResize from './windowResize.png';
import maximize from './maximize.png';
import minimize from './minimize.png';
import computerBig from './computerBig.png';
import computerSmall from './computerSmall.png';
import myComputer from './myComputer.png';
import showcaseIcon from './showcaseIcon.png';
import credits from './credits.png';
import galleryIcon from './galleryIcon.png';
import notepadIcon from './notepadIcon.png';
import filesIcon from './filesIcon.png';
import settingsIcon from './settingsIcon.png';
import trashIcon from './trashIcon.png';
import aboutIcon from './aboutIcon.png';
import volumeOn from './volumeOn.png';
import volumeOff from './volumeOff.png';
import windowExplorerIcon from './windowExplorerIcon.png';
import windowsStartIcon from './windowsStartIcon.png';
import close from './close.png';
import cd from './cd.png';

const icons = {
    windowResize: windowResize,
    maximize: maximize,
    minimize: minimize,
    computerBig: computerBig,
    computerSmall: computerSmall,
    myComputer: myComputer,
    showcaseIcon: showcaseIcon,
    volumeOn: volumeOn,
    volumeOff: volumeOff,
    credits: credits,
    galleryIcon: galleryIcon,
    notepadIcon: notepadIcon,
    filesIcon: filesIcon,
    settingsIcon: settingsIcon,
    trashIcon: trashIcon,
    aboutIcon: aboutIcon,
    close: close,
    windowExplorerIcon: windowExplorerIcon,
    windowsStartIcon: windowsStartIcon,
    cd: cd,
};

export type IconName = keyof typeof icons;

const getIconByName = (
    iconName: IconName
    // @ts-ignore
): React.FC<React.SVGAttributes<SVGElement>> => icons[iconName];

export default getIconByName;
