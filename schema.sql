-- Ticket to Ride: Neon Edition — banco de dados
CREATE DATABASE IF NOT EXISTS ttr_neon CHARACTER SET utf8mb4;
USE ttr_neon;

CREATE TABLE IF NOT EXISTS partidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status VARCHAR(20) DEFAULT 'em_andamento',
  turno TINYINT DEFAULT 0,
  estado JSON,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jogadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partida_id INT,
  nome VARCHAR(50),
  cor_neon VARCHAR(20),
  pontuacao INT DEFAULT 0,
  trens_restantes INT DEFAULT 20,
  FOREIGN KEY (partida_id) REFERENCES partidas(id)
);

CREATE TABLE IF NOT EXISTS cartas_trem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partida_id INT,
  jogador_id INT NULL,
  cor VARCHAR(15),
  local ENUM('baralho','mao','aberta') DEFAULT 'baralho',
  FOREIGN KEY (partida_id) REFERENCES partidas(id)
);

CREATE TABLE IF NOT EXISTS rotas_conquistadas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partida_id INT,
  jogador VARCHAR(5),
  rota_nome VARCHAR(100),
  cor VARCHAR(15),
  tamanho TINYINT,
  FOREIGN KEY (partida_id) REFERENCES partidas(id)
);

CREATE TABLE IF NOT EXISTS bilhetes_destino (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partida_id INT,
  jogador_id INT NULL,
  cidade_a VARCHAR(50),
  cidade_b VARCHAR(50),
  pontos INT,
  status ENUM('ativo','concluido','fracassado') DEFAULT 'ativo',
  FOREIGN KEY (partida_id) REFERENCES partidas(id)
);
