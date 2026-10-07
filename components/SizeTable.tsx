import { PRODUCT } from "@/lib/catalog";

export function SizeTable() {
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th scope="col">Size</th>
          <th scope="col">Shoulder</th>
          <th scope="col">Chest</th>
          <th scope="col">Length</th>
        </tr>
      </thead>
      <tbody>
        {PRODUCT.sizeChart.map((r) => (
          <tr key={r.size}>
            <th scope="row">{r.size}</th>
            <td>{r.shoulderCm} cm</td>
            <td>{r.chestCm} cm</td>
            <td>{r.lengthCm} cm</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
