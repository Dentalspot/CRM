export const cleanRut = (rut) => {
    if (!rut) return '';
    return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};

export const formatRut = (rut) => {
    const cleanedRut = cleanRut(rut);
    if (cleanedRut.length <= 1) return cleanedRut;

    let rutBody = cleanedRut.slice(0, -1);
    const dv = cleanedRut.slice(-1);

    rutBody = rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${rutBody}-${dv}`;
};

export const validateRut = (rut) => {
    // Accept both formatted (12.345.678-9) and clean (123456789) RUTs
    const cleaned = cleanRut(rut);
    if (cleaned.length < 2) return false;

    let rutBody = parseInt(cleaned.slice(0, -1), 10);
    let dv = cleaned.slice(-1).toUpperCase();

    let M = 0;
    let S = 1;

    for (; rutBody; rutBody = Math.floor(rutBody / 10)) {
        S = (S + rutBody % 10 * (9 - M++ % 6)) % 11;
    }

    const calculatedDv = S ? String(S - 1) : 'K';

    return calculatedDv === dv;
};