<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

$acao = $_GET['acao'] ?? '';

try {
    $pdo = conectar();

    switch ($acao) {
        case 'salvar':
            $input = json_decode(file_get_contents('php://input'), true);
            $estado = $input['estado'] ?? null;
            if (!$estado) { echo json_encode(['ok'=>false,'erro'=>'sem estado']); exit; }

            $status = !empty($estado['finalizada']) ? 'encerrado' : 'em_andamento';
            $turno  = (int)($estado['turno'] ?? 0);
            $json   = json_encode($estado, JSON_UNESCAPED_UNICODE);
            $id     = $estado['partida_id'] ?? null;

            // transação: ou grava a partida inteira, ou não grava nada
            $pdo->beginTransaction();
            try {
                // UPDATE não pode ser usado sozinho: rowCount() é 0 quando o estado
                // não mudou, o que criaria partidas duplicadas a cada salvamento.
                if ($id !== null) {
                    $chk = $pdo->prepare('SELECT id FROM partidas WHERE id=?');
                    $chk->execute([$id]);
                    if ($chk->fetch()) {
                        $pdo->prepare('UPDATE partidas SET status=?, turno=?, estado=? WHERE id=?')
                            ->execute([$status, $turno, $json, $id]);
                    } else {
                        $id = null; // partida sumiu do banco -> recria
                    }
                }
                if ($id === null) {
                    $pdo->prepare('INSERT INTO partidas (status, turno, estado) VALUES (?,?,?)')
                        ->execute([$status, $turno, $json]);
                    $id = (int)$pdo->lastInsertId();
                }
                // espelha rotas conquistadas (persistência legível)
                $pdo->prepare('DELETE FROM rotas_conquistadas WHERE partida_id=?')->execute([$id]);
                $ins = $pdo->prepare('INSERT INTO rotas_conquistadas (partida_id, jogador, rota_nome, cor, tamanho) VALUES (?,?,?,?,?)');
                foreach (($estado['rotas'] ?? []) as $r) {
                    if (!empty($r['dono'])) {
                        $ins->execute([$id, $r['dono'], $r['a'].' ⇄ '.$r['b'], $r['cor'], (int)$r['tam']]);
                    }
                }
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }
            echo json_encode(['ok'=>true,'partida_id'=>$id]);
            break;

        case 'carregar_ultimo':
            $st = $pdo->query('SELECT id, estado FROM partidas WHERE status="em_andamento" ORDER BY id DESC LIMIT 1');
            $row = $st->fetch();
            if ($row) {
                $estado = json_decode($row['estado'], true);
                $estado['partida_id'] = $row['id'];
                echo json_encode(['ok'=>true,'estado'=>$estado]);
            } else {
                echo json_encode(['ok'=>false,'erro'=>'nenhuma partida']);
            }
            break;

        case 'listar':
            $st = $pdo->query('SELECT id, status, data_criacao FROM partidas ORDER BY id DESC');
            echo json_encode(['ok'=>true,'partidas'=>$st->fetchAll()]);
            break;

        default:
            echo json_encode(['ok'=>false,'erro'=>'ação inválida']);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'erro'=>$e->getMessage()]);
}
