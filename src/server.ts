const express = require('express');
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes';
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string';

const app = express();
app.use(express.json());
const prisma = new PrismaClient({
	log: ['query'],
});

app.use(cors());

app.get('/games', async (request: any, response: any) => {
	const games = await prisma.game.findMany({
		include: {
			_count: {
				select: {
					ads: true,
				},
			},
		},
	});
	return response.json(games);
});

app.post('/games/:id/ads', async (request: any, response: any) => {
	const gameId = request.params.id;
	const body = request.body;

	const ad = await prisma.ad.create({
		data: {
			gameId,
			name: body.name,
			yearsPlaying: body.yearsPlaying,
			discord: body.discord,
			weekDays: body.weekDays.join(','),
			hourStart: convertHourStringToMinutes(body.hourStart),
			hourEnd: convertHourStringToMinutes(body.hourEnd),
			useVoiceChannel: body.useVoiceChannel,
		},
	});

	return response.status(201).json(ad);
});

app.get('/games/:id/ads', async (request: any, response: any) => {
	const gameId = request.params.id;

	const ads = await prisma.ad.findMany({
		select: {
			id: true,
			name: true,
			weekDays: true,
			useVoiceChannel: true,
			yearsPlaying: true,
			hourStart: true,
			hourEnd: true,
		},
		where: {
			gameId,
		},
		orderBy: {
			CreatedAt: 'desc',
		},
	});

	return response.json(
		ads.map(ad => {
			return {
				...ad,
				weekDays: ad.weekDays.split(','),
				hourStart: convertMinutesToHourString(ad.hourStart),
				hourEnd: convertMinutesToHourString(ad.hourEnd),
			};
		})
	);
});

app.get('/ads/:id/discord', async (request: any, response: any) => {
	const adId = request.params.id;

	const ads = await prisma.ad.findUniqueOrThrow({
		select: {
			discord: true,
		},
		where: {
			id: adId,
		},
	});

	return response.json(ads);
});

app.listen('3333');
