// ModalConfirmar.tsx

import './ModalConfirmar.css';

const ModalConfirmar = ({  onConfirmar, onCancelar }: any) => {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <p>¿Desea eliminar el mensaje?</p>
        <div className="botones">
          <button onClick={onConfirmar} className="btn-confirmar">Sí</button>
          <button onClick={onCancelar} className="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmar;
