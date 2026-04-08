
export const calcularHorasPIE = ({ studentsTransitoria, studentsPermanente }) => {
  const horasDirectas = (studentsTransitoria * 2) + (studentsPermanente * 5);
  const horasColaborativas = horasDirectas * 0.20;
  const horasAdministrativas = horasDirectas * 0.10;
  return {
    horasDirectas,
    horasColaborativas,
    horasAdministrativas,
    totalHoras: horasDirectas + horasColaborativas + horasAdministrativas
  };
};
